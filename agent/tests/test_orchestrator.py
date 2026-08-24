from __future__ import annotations

import json
import unittest
from datetime import UTC, datetime

from artham_partner.story_pipeline.contracts import (
    MediaPlan,
    SelectedTopic,
    StoryGenerationRequest,
    TopicCandidates,
    VideoDecision,
    VideoRequest,
)
from artham_partner.story_pipeline.errors import ValidationFailure
from artham_partner.story_pipeline.orchestrator import (
    StoryOrchestrator,
    _encode_payload,
    _is_resource_exhausted,
    _normalize_activity_output,
    _normalize_media_output,
    _normalize_storyline_output,
)
from tests.helpers import bundle


class OrchestratorPolicyTests(unittest.TestCase):
    def test_adk_namespaced_resource_exhaustion_is_retryable(self) -> None:
        alternate_error = type("_ResourceExhaustedError", (Exception,), {})

        self.assertTrue(
            _is_resource_exhausted(
                alternate_error("429 RESOURCE_EXHAUSTED. Please try again later.")
            )
        )
        self.assertFalse(_is_resource_exhausted(RuntimeError("unrelated failure")))

    def test_llm_payload_serializes_contract_values(self) -> None:
        encoded = _encode_payload(
            {"generated_at": datetime(2026, 1, 2, 3, 4, tzinfo=UTC)}
        )
        self.assertEqual(
            encoded, '{"generated_at":"2026-01-02T03:04:00Z"}'
        )

    def test_storyline_normalization_shortens_long_beats(self) -> None:
        raw = {"scenes": [{"beat": "Compare the collapsing stellar remnants"}]}

        normalized = _normalize_storyline_output(raw)

        self.assertLessEqual(len(normalized["scenes"][0]["beat"]), 32)
        self.assertFalse(normalized["scenes"][0]["beat"].endswith(" "))

    def test_media_plan_keeps_only_generated_image_dicts(self) -> None:
        value = bundle()
        generated = next(
            asset.model_dump(mode="json")
            for asset in value.assets
            if asset.kind.value == "image"
        )

        retained = StoryOrchestrator._retain_generated_images(
            value.media_plan,
            [generated],
        )

        self.assertEqual(
            [image.asset_key for image in retained.images],
            [generated["asset_key"]],
        )

    def test_incomplete_image_generation_blocks_persistence(self) -> None:
        value = bundle()
        audio = next(
            asset.model_dump(mode="json")
            for asset in value.assets
            if asset.kind.value == "audio"
        )

        with self.assertRaisesRegex(ValidationFailure, "missing images"):
            StoryOrchestrator._assert_complete_assets(
                value.media_plan,
                [],
                [audio],
            )

    def test_missing_required_audio_blocks_persistence(self) -> None:
        value = bundle()
        images = [
            asset.model_dump(mode="json")
            for asset in value.assets
            if asset.kind.value == "image"
        ]

        with self.assertRaisesRegex(ValidationFailure, "audio mismatch"):
            StoryOrchestrator._assert_complete_assets(
                value.media_plan,
                images,
                [],
            )

    def test_two_missing_scene_images_are_allowed(self) -> None:
        value = bundle()
        images = [
            asset.model_dump(mode="json")
            for asset in value.assets
            if asset.kind.value == "image"
        ]
        audio = [
            asset.model_dump(mode="json")
            for asset in value.assets
            if asset.kind.value == "audio"
        ]
        retained_images = [
            asset
            for asset in images
            if asset["asset_key"] not in {"scene-s1", "scene-s2"}
        ]

        StoryOrchestrator._assert_complete_assets(
            value.media_plan,
            retained_images,
            audio,
        )

    def test_duplicate_generated_image_blocks_persistence(self) -> None:
        value = bundle()
        images = [
            asset.model_dump(mode="json")
            for asset in value.assets
            if asset.kind.value == "image"
        ]
        audio = [
            asset.model_dump(mode="json")
            for asset in value.assets
            if asset.kind.value == "audio"
        ]

        with self.assertRaisesRegex(ValidationFailure, "unexpected images"):
            StoryOrchestrator._assert_complete_assets(
                value.media_plan,
                images + images,
                audio,
            )

    def test_media_prose_is_trimmed_to_contract_limits(self) -> None:
        raw = {
            "visual_style_guide": "x" * 1001,
            "images": [{"prompt": "p" * 1801, "alt_text": "a" * 301}],
        }

        normalized = _normalize_media_output(raw)

        self.assertEqual(len(normalized["visual_style_guide"]), 1000)
        self.assertEqual(len(normalized["images"][0]["prompt"]), 1800)
        self.assertEqual(len(normalized["images"][0]["alt_text"]), 300)
        self.assertIn(
            "fictional adults age 21 or older",
            normalized["images"][0]["prompt"],
        )
        self.assertIn(
            "no text or writing of any kind",
            normalized["images"][0]["prompt"],
        )

    def test_media_fallback_has_images_and_audio_without_video(self) -> None:
        value = bundle()
        request = StoryGenerationRequest(
            learner_id="learner",
            idempotency_key="fallback-media",
        )

        fallback = StoryOrchestrator._fallback_media_plan(
            value.storyline,
            request,
        )

        self.assertEqual(fallback.images, [])
        self.assertIsNone(fallback.video)
        self.assertIsNotNone(fallback.audio)

    def test_media_fallback_can_add_audio(self) -> None:
        value = bundle()
        request = StoryGenerationRequest(
            learner_id="learner",
            idempotency_key="fallback-audio",
        )
        incomplete = value.media_plan.model_copy(update={"audio": None})

        fallback = StoryOrchestrator._fallback_media_plan(
            value.storyline,
            request,
        )
        completed = incomplete.model_copy(
            update={"audio": incomplete.audio or fallback.audio}
        )

        self.assertIsNotNone(completed.audio)

    def test_short_slider_feedback_is_expanded_before_validation(self) -> None:
        raw = {
            "activities": {
                "activities": [
                    {
                        "slider": {
                            "bands": [
                                {"text": "Low"},
                                {"text": "A useful detailed outcome"},
                            ]
                        }
                    }
                ]
            }
        }

        normalized = _normalize_activity_output(raw)

        bands = normalized["activities"]["activities"][0]["slider"]["bands"]
        self.assertEqual(
            bands[0]["text"],
            "Low setting; observe the displayed consequence.",
        )
        self.assertEqual(bands[1]["text"], "A useful detailed outcome")

    def test_quiz_answers_are_distributed_across_positions(self) -> None:
        raw = {
            "activities": {
                "activities": [
                    {
                        "quiz": {
                            "options": [
                                {"option_id": "wrong-1"},
                                {"option_id": "right-1"},
                            ],
                            "correct_option_ids": ["right-1"],
                        }
                    },
                    {
                        "quiz": {
                            "options": [
                                {"option_id": "wrong-2"},
                                {"option_id": "right-2"},
                            ],
                            "correct_option_ids": ["right-2"],
                        }
                    },
                ]
            }
        }

        normalized = _normalize_activity_output(raw)
        activities = normalized["activities"]["activities"]

        self.assertEqual(activities[0]["quiz"]["options"][0]["option_id"], "right-1")
        self.assertEqual(activities[1]["quiz"]["options"][1]["option_id"], "right-2")

    def test_activity_normalization_keeps_only_declared_payload(self) -> None:
        raw = {
            "kind": "simulation",
            "quiz": {"prompt": "stale"},
            "simulation": {"model_kind": "thermal"},
            "reorder": None,
        }

        normalized = _normalize_activity_output(raw)

        self.assertIsNone(normalized["quiz"])
        self.assertEqual(normalized["simulation"]["model_kind"], "thermal")

    def test_linear_slider_coefficients_follow_promised_target(self) -> None:
        raw = {
            "activities": [
                {
                    "kind": "slider",
                    "slider": {
                        "readout_expr": "linear",
                        "readout_params": {},
                        "target_minimum": 2,
                        "target_maximum": 2,
                        "guide": {"watch": "The supply reaches 20 days."},
                        "explanation": "The planned supply reaches 20 days.",
                        "bands": [],
                    },
                }
            ]
        }

        normalized = _normalize_activity_output(raw)

        params = normalized["activities"][0]["slider"]["readout_params"]
        self.assertEqual(params, {"intercept": 0.0, "slope": 10.0})

    def test_video_gate_cannot_change_duration(self) -> None:
        planned = VideoRequest(
            asset_key="clip",
            scene_id="s2",
            prompt=(
                "Fictional fixed-camera footage showing a machine response "
                "over time, with no people, logos, or readable text."
            ),
            narrative_necessity=(
                "The timing between the input and response is the evidence."
            ),
            duration_seconds=6,
        )
        approved = planned.model_copy(update={"duration_seconds": 8})
        plan = MediaPlan(
            images=[
                {
                    "asset_key": "cover",
                    "scene_id": "s1",
                    "prompt": (
                        "A fictional machine room establishing shot without "
                        "people, logos, or readable text."
                    ),
                    "alt_text": "A quiet machine room.",
                }
            ],
            video=planned,
            visual_style_guide=(
                "Grounded editorial realism with consistent industrial details."
            ),
        )
        decision = VideoDecision(
            approved=True,
            reason="Motion carries timing evidence needed by the learner.",
            approved_request=approved,
        )
        request = StoryGenerationRequest(
            learner_id="learner",
            idempotency_key="request-key",
        )
        with self.assertRaises(ValidationFailure):
            StoryOrchestrator._assert_video_decision(
                decision, plan, request
            )

    def test_optional_video_failure_falls_back_to_scene_image(self) -> None:
        planned = VideoRequest(
            asset_key="clip",
            scene_id="s2",
            prompt=(
                "Fictional fixed-camera footage showing a machine response "
                "over time, with no people, logos, or readable text."
            ),
            narrative_necessity=(
                "The timing between the input and response is the evidence."
            ),
            duration_seconds=6,
        )
        plan = MediaPlan(
            images=[
                {
                    "asset_key": "cover",
                    "scene_id": "s1",
                    "prompt": (
                        "A fictional adult engineer inspects a machine room "
                        "without logos or readable text."
                    ),
                    "alt_text": "An engineer inspects a machine room.",
                }
            ],
            video=planned,
            visual_style_guide=(
                "Grounded editorial realism with consistent industrial details."
            ),
        )
        decision = VideoDecision(
            approved=True,
            reason="Motion carries timing evidence needed by the learner.",
            approved_request=planned,
        )

        resolved_plan, resolved_decision = (
            StoryOrchestrator._resolve_optional_video(plan, decision, [])
        )

        self.assertIsNone(resolved_plan.video)
        self.assertFalse(resolved_decision.approved)
        self.assertIsNone(resolved_decision.approved_request)

    def test_repair_versions_every_regenerated_asset_key(self) -> None:
        plan = MediaPlan(
            images=[
                {
                    "asset_key": "scene-one",
                    "scene_id": "s1",
                    "prompt": (
                        "Maya, a fictional adult engineer, checks a simple circuit "
                        "in a bright workshop with no readable text."
                    ),
                    "alt_text": "Maya checks a simple circuit.",
                }
            ],
            video={
                "asset_key": "clip",
                "scene_id": "s1",
                "prompt": (
                    "Maya, a fictional adult engineer, switches a simple circuit "
                    "on and watches its light change over time."
                ),
                "narrative_necessity": (
                    "Motion shows the delay between switching and the light changing."
                ),
            },
            audio={
                "asset_key": "score",
                "prompt": (
                    "A loopable instrumental educational science-adventure score."
                ),
            },
            visual_style_guide=(
                "Warm animated-film lighting with consistent adult characters."
            ),
        )

        versioned = StoryOrchestrator._version_media_asset_keys(plan, 2)

        self.assertEqual(versioned.images[0].asset_key, "scene-one-r2")
        self.assertEqual(versioned.video.asset_key, "clip-r2")
        self.assertEqual(versioned.audio.asset_key, "score-r2")
        self.assertEqual(plan.images[0].asset_key, "scene-one")

    def test_selector_content_is_restored_from_canonical_candidate(self) -> None:
        value = bundle()
        canonical = value.selected_topic.candidate
        changed = canonical.model_copy(
            update={"title": "A paraphrased candidate title"}
        )
        selected = SelectedTopic(
            candidate=changed,
            engagement_rationale=(
                "This candidate gives the learner clear evidence and a useful "
                "foundational decision."
            ),
            predicted_engagement_score=0.8,
            novelty_balance=(
                "The format is familiar while the semiconductor concept is new."
            ),
        )

        result = StoryOrchestrator._canonicalize_selected(
            selected, TopicCandidates(candidates=[canonical] * 4)
        )

        self.assertEqual(result.candidate, canonical)

    def test_storyline_citations_are_restored_after_repair(self) -> None:
        value = bundle()
        canonical = value.selected_topic.candidate.source_evidence
        changed = value.storyline.model_copy(
            update={
                "citations": [
                    canonical[0].model_copy(
                        update={"excerpt": "A repair-agent paraphrase."}
                    )
                ]
            }
        )

        result = StoryOrchestrator._canonicalize_storyline_sources(
            changed, canonical
        )

        self.assertEqual(result.citations, canonical)

    def test_partial_hint_lists_are_completed(self) -> None:
        raw = {
            "scenes": [
                {
                    "scene_id": "s1",
                    "hints": ["Watch what changes first.", "Trace the current."],
                }
            ]
        }

        normalized = _normalize_storyline_output(raw)

        self.assertEqual(len(normalized["scenes"][0]["hints"]), 3)
        self.assertEqual(
            normalized["scenes"][0]["hints"][:2],
            ["Watch what changes first.", "Trace the current."],
        )


class StructuredOutputRetryTests(unittest.IsolatedAsyncioTestCase):
    async def test_retries_once_with_validation_feedback(self) -> None:
        class FakeContext:
            def __init__(self) -> None:
                self.inputs: list[dict[str, object]] = []
                self.outputs = [
                    {
                        "approved": False,
                        "reason": "too short",
                        "approved_request": None,
                    },
                    {
                        "approved": False,
                        "reason": "Motion is not necessary for this story beat.",
                        "approved_request": None,
                    },
                ]

            async def run_node(self, _agent, *, node_input, use_sub_branch):
                self.inputs.append(json.loads(node_input))
                return self.outputs.pop(0)

        context = FakeContext()
        orchestrator = StoryOrchestrator.__new__(StoryOrchestrator)

        result = await orchestrator._run_llm(
            context,
            object(),
            {"storyline": {"title": "Test"}},
            VideoDecision,
        )

        self.assertFalse(result.approved)
        self.assertEqual(len(context.inputs), 2)
        correction = context.inputs[1]["schema_correction"]
        self.assertEqual(correction["validation_errors"][0]["path"], "reason")
        self.assertEqual(correction["invalid_output"]["reason"], "too short")


if __name__ == "__main__":
    unittest.main()
