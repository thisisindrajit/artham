from __future__ import annotations

import json
from types import SimpleNamespace
import unittest
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

from artham_partner.story_pipeline.contracts import (
    ActivityKind,
    ActivitySpec,
    Difficulty,
    MediaPlan,
    PersistenceReceipt,
    ResearchCorpus,
    RepairResult,
    RepairComponent,
    SceneDraft,
    ScenePrimer,
    SceneSpec,
    SelectedTopic,
    SourceEvidence,
    StoryGenerationRequest,
    StoryGenerationResult,
    StoryBlueprint,
    StorylineDraft,
    SubjectRef,
    TopicCandidates,
    ValidationReport,
    ValidationIssue,
    ValidationSeverity,
    VideoDecision,
    VideoRequest,
)
from artham_partner.story_pipeline.errors import ValidationFailure
from artham_partner.story_pipeline.clients.vertex import GeneratedBinary
from artham_partner.story_pipeline.nodes import ImageGenerationAgent
from artham_partner.story_pipeline.orchestrator import (
    StoryOrchestrator,
    _encode_payload,
    _is_resource_exhausted,
    _normalize_activity_output,
    _normalize_blueprint_output,
    _normalize_media_output,
    _normalize_storyline_output,
    _normalize_validation_output,
)
from tests.helpers import bundle, settings


class OrchestratorPolicyTests(unittest.IsolatedAsyncioTestCase):
    async def test_scene_workers_receive_difficulty_and_prior_teaching_only(self) -> None:
        value = bundle()
        blueprint = StoryBlueprint(
            **value.storyline.model_dump(exclude={"scenes"}),
            continuity_bible="Keep the same people and teaching sequence.",
            scenes=[
                SceneSpec(
                    scene_id=scene.scene_id,
                    position=index,
                    act=scene.act,
                    title=scene.title,
                    beat=scene.beat,
                    narrative_goal="Explain the visible change before asking.",
                    learning_purpose=f"Teach the cause in scene {index}.",
                    required_facts=[f"Source-supported fact for scene {index}."],
                    character_names=[],
                    interaction_slot=scene.interaction_slot,
                    next_scene_id=scene.next_scene_id,
                    scene_type=scene.scene_type,
                    mood=scene.mood,
                    concept=scene.concept,
                    include_primer=bool(scene.primer),
                    include_trivia=bool(scene.trivia),
                    trivia_fact=scene.trivia.text if scene.trivia else None,
                    reference_subject=None,
                    outcome=scene.outcome,
                )
                for index, scene in enumerate(value.storyline.scenes)
            ],
        )
        for difficulty in Difficulty:
            with self.subTest(difficulty=difficulty):
                request = StoryGenerationRequest(
                    learner_id="learner", idempotency_key="teaching-context",
                    target_age=14, difficulty=difficulty,
                )
                runtime = SimpleNamespace(
                    settings=settings(),
                    checkpoints={"job": {
                        "corpus": ResearchCorpus(
                            query="systems", sources=value.storyline.citations * 3,
                        ).model_dump(mode="json"),
                        "engagement": {},
                        "selected_topic": value.selected_topic.model_dump(mode="json"),
                    }},
                )
                orchestrator = StoryOrchestrator(runtime)  # type: ignore[arg-type]
                captured = []

                async def run_llm(ctx, agent, payload, output_model):
                    if output_model is StoryBlueprint:
                        return blueprint
                    self.assertIs(output_model, SceneDraft)
                    captured.append(payload)
                    return next(
                        scene for scene in value.storyline.scenes
                        if scene.scene_id == payload["scene_spec"]["scene_id"]
                    )

                # Stop after scene assembly, before activity generation.
                with (
                    patch.object(orchestrator, "_run_llm", side_effect=run_llm),
                    patch.object(
                        orchestrator, "_dedupe_primers",
                        side_effect=RuntimeError("stop before activities"),
                    ) as dedupe,
                    self.assertRaisesRegex(RuntimeError, "stop before activities"),
                ):
                    await orchestrator.generate(
                        ctx=SimpleNamespace(run_node=AsyncMock()),
                        request=request, job_id="job",
                    )

                self.assertEqual(len(captured), len(blueprint.scenes))
                for payload in captured:
                    position = payload["scene_spec"]["position"]
                    self.assertEqual(payload["request"]["difficulty"], difficulty.value)
                    self.assertEqual(payload["request"]["target_age"], 14)
                    expected_difficulty = (
                        blueprint.difficulty if difficulty is Difficulty.ADAPTIVE
                        else difficulty
                    )
                    self.assertEqual(payload["blueprint"]["difficulty"], expected_difficulty)
                    self.assertEqual(
                        payload["prior_learning_context"],
                        [
                            {
                                "scene_id": item.scene_id,
                                "learning_purpose": item.learning_purpose,
                                "required_facts": item.required_facts,
                            }
                            for item in blueprint.scenes[:position]
                        ],
                    )
                self.assertTrue(all(
                    scene.reference_subject is None
                    for scene in dedupe.call_args.args[0].scenes
                ))
                self.assertTrue(all(
                    scene.learning_reference is None
                    for scene in dedupe.call_args.args[0].scenes
                ))

    async def test_story_repair_realigns_only_changed_scene_activities(self) -> None:
        value = bundle()
        for teaching_changed in (False, True):
            with self.subTest(teaching_changed=teaching_changed):
                replacement = value.storyline.model_copy(deep=True)
                if teaching_changed:
                    replacement.scenes[0].narrative = [
                        "You change only one setting. The reading changes, while "
                        "the other settings stay the same. This helps you find "
                        "which setting caused the change."
                    ]
                runtime = SimpleNamespace(settings=settings())
                orchestrator = StoryOrchestrator(runtime)  # type: ignore[arg-type]
                repaired_payloads = []

                async def run_llm(ctx, agent, payload, output_model):
                    if output_model is StorylineDraft:
                        return replacement
                    self.assertIs(output_model, ActivitySpec)
                    repaired_payloads.append(payload)
                    return next(
                        item for item in value.activities.activities
                        if item.scene_id == payload["scene"]["scene_id"]
                    )

                report = ValidationReport(
                    is_valid=False, quality_score=80,
                    factual_grounding_summary="The cited sources support the claims.",
                    safety_summary="The content is suitable for the requested age.",
                    issues=[ValidationIssue(
                        code="ASSUMED_PRIOR_KNOWLEDGE",
                        severity=ValidationSeverity.ERROR,
                        component=RepairComponent.STORYLINE,
                        path="storyline.scenes[s1].narrative",
                        message="The cause was named but never explained.",
                        repair_instruction="Explain what changes before asking.",
                    )],
                )
                with (
                    patch.object(orchestrator, "_run_llm", side_effect=run_llm),
                    patch.object(orchestrator, "_embeddings", return_value=value.embeddings),
                ):
                    await orchestrator._repair_bundle(
                        ctx=SimpleNamespace(run_node=AsyncMock()),
                        request=StoryGenerationRequest(
                            learner_id="learner", idempotency_key="repair-teaching",
                            difficulty=Difficulty.EASY, target_age=14,
                            media_budget={"max_images": len(value.media_plan.images)},
                        ),
                        bundle=value, report=report, repair_cycle=1,
                    )
                self.assertEqual(len(repaired_payloads), int(teaching_changed))
                if teaching_changed:
                    payload = repaired_payloads[0]
                    self.assertTrue(payload["teaching_changed"])
                    self.assertEqual(payload["request"]["difficulty"], "easy")
                    self.assertEqual(
                        payload["scene"]["narrative"], replacement.scenes[0].narrative,
                    )

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

    def test_learner_quality_threshold_requests_repair(self) -> None:
        report = ValidationReport(
            is_valid=True,
            quality_score=74,
            issues=[],
            learner_feedback="I followed the plot, but the main idea still felt rushed.",
            improvement_priorities=["Slow down the central explanation."],
            factual_grounding_summary="The important factual claims are supported.",
            safety_summary="The story contains no unsafe material.",
        )

        self.assertTrue(StoryOrchestrator._needs_repair(report))
        self.assertFalse(
            StoryOrchestrator._needs_repair(
                report.model_copy(update={"quality_score": 75})
            )
        )

    def test_storyline_normalization_shortens_long_beats(self) -> None:
        raw = {
            "scenes": [
                {
                    "beat": "Compare the collapsing stellar remnants "
                    "against the archived satellite timing logs one more "
                    "time before drawing any firm conclusion about causes."
                }
            ]
        }

        normalized = _normalize_storyline_output(raw)

        self.assertLessEqual(len(normalized["scenes"][0]["beat"]), 160)
        self.assertFalse(normalized["scenes"][0]["beat"].endswith(" "))

    def test_storyline_normalization_shortens_long_synopsis(self) -> None:
        raw = {
            "synopsis": "A future city learns how world models work. " * 12,
            "scenes": [],
        }

        normalized = _normalize_storyline_output(raw)

        self.assertLessEqual(len(normalized["synopsis"]), 360)
        self.assertTrue(normalized["synopsis"].endswith("."))

    def test_validation_normalization_bounds_generated_prose(self) -> None:
        raw = {
            "learner_feedback": "Detailed learner feedback. " * 80,
            "factual_grounding_summary": "Grounded factual summary. " * 80,
            "safety_summary": "Age-appropriate safety summary. " * 80,
            "improvement_priorities": [f"Priority {index}" for index in range(8)],
            "issues": [
                {
                    "message": "Detailed issue message. " * 50,
                    "repair_instruction": "Detailed repair instruction. " * 50,
                }
            ],
        }

        normalized = _normalize_validation_output(raw)

        self.assertLessEqual(len(normalized["learner_feedback"]), 1200)
        self.assertLessEqual(len(normalized["factual_grounding_summary"]), 1200)
        self.assertLessEqual(len(normalized["safety_summary"]), 1200)
        self.assertEqual(len(normalized["improvement_priorities"]), 6)
        self.assertLessEqual(len(normalized["issues"][0]["message"]), 800)
        self.assertLessEqual(
            len(normalized["issues"][0]["repair_instruction"]), 800
        )

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

    async def test_available_real_world_references_are_backfilled(self) -> None:
        value = bundle()
        references = {
            scene.reference_subject
            or f"subject-for-{scene.scene_id}": scene.learning_reference
            for scene in value.storyline.scenes
            if scene.learning_reference is not None
        }
        storyline = value.storyline.model_copy(
            update={
                "scenes": [
                    scene.model_copy(
                        update={
                            "learning_reference": None,
                            "reference_subject": (
                                scene.reference_subject
                                or f"subject-for-{scene.scene_id}"
                            ),
                            "reference_fact": value.storyline.citations[0].excerpt,
                            "reference_fact_citation_refs": [1],
                        }
                    )
                    for scene in value.storyline.scenes
                ]
            }
        )
        runtime = SimpleNamespace(
            settings=settings(),
            exa=SimpleNamespace(
                find_reference_image=AsyncMock(
                    side_effect=lambda subject: references.get(subject)
                )
            ),
        )
        orchestrator = StoryOrchestrator(runtime)  # type: ignore[arg-type]

        updated = await orchestrator._attach_reference_images(storyline)

        attached = [
            scene.learning_reference
            for scene in updated.scenes
            if scene.learning_reference is not None
        ]
        self.assertEqual(len(attached), len(references))
        for reference in attached:
            self.assertEqual(reference.plain_explanation, value.storyline.citations[0].excerpt)
            self.assertEqual(reference.citation_refs, [1])

    async def test_reference_fact_is_not_overwritten_by_a_generic_image_description(self) -> None:
        value = bundle()
        fact = (
            "During the 1919 eclipse, astronomers used photographs of stars near "
            "the Sun to test whether gravity bends their light."
        )
        value.storyline.citations[0] = value.storyline.citations[0].model_copy(
            update={"excerpt": fact}
        )
        references = {
            (scene.reference_subject or f"subject-for-{scene.scene_id}"): (
                scene.learning_reference.model_copy(
                    update={
                        "page_summary": (
                            "A photograph of the 1919 solar eclipse corona."
                        )
                    }
                )
            )
            for scene in value.storyline.scenes
            if scene.learning_reference is not None
        }
        storyline = value.storyline.model_copy(
            update={
                "scenes": [
                    scene.model_copy(
                        update={
                            "learning_reference": None,
                            "reference_subject": (
                                scene.reference_subject
                                or f"subject-for-{scene.scene_id}"
                            ),
                            "reference_fact": fact,
                            "reference_fact_citation_refs": [1, 99],
                        }
                    )
                    for scene in value.storyline.scenes
                ]
            }
        )
        runtime = SimpleNamespace(
            settings=settings(),
            exa=SimpleNamespace(
                find_reference_image=AsyncMock(
                    side_effect=lambda subject: references.get(subject)
                )
            ),
        )
        orchestrator = StoryOrchestrator(runtime)  # type: ignore[arg-type]

        updated = await orchestrator._attach_reference_images(storyline)

        explanations = [
            scene.learning_reference.plain_explanation
            for scene in updated.scenes
            if scene.learning_reference is not None
        ]
        self.assertTrue(explanations)
        for explanation in explanations:
            self.assertEqual(explanation, fact)
        for scene in updated.scenes:
            if scene.learning_reference:
                self.assertEqual(scene.learning_reference.citation_refs, [1])

    async def test_reference_without_supported_fact_is_omitted_without_searching(self) -> None:
        value = bundle()
        runtime = SimpleNamespace(
            settings=settings(),
            exa=SimpleNamespace(find_reference_image=AsyncMock()),
        )
        orchestrator = StoryOrchestrator(runtime)  # type: ignore[arg-type]
        for fact, refs in (
            (None, []),
            (value.storyline.citations[0].excerpt, []),
            (value.storyline.citations[0].excerpt, [99]),
        ):
            with self.subTest(fact=fact, refs=refs):
                storyline = value.storyline.model_copy(update={
                    "scenes": [
                        scene.model_copy(update={
                            "reference_subject": f"subject-for-{scene.scene_id}",
                            "reference_fact": fact,
                            "reference_fact_citation_refs": refs,
                        })
                        for scene in value.storyline.scenes
                    ],
                })
                with self.assertLogs(
                    "artham_partner.story_pipeline.orchestrator", level="INFO"
                ):
                    updated = await orchestrator._attach_reference_images(storyline)
                self.assertTrue(all(
                    scene.learning_reference is None for scene in updated.scenes
                ))
        runtime.exa.find_reference_image.assert_not_awaited()

    def test_dedupe_primers_drops_near_identical_wording(self) -> None:
        value = bundle()
        scenes = list(value.storyline.scenes)
        # s3's primer is the same idea as s1's primer, just reworded slightly.
        duplicate_primer = ScenePrimer(
            term="Variable",
            plain="A variable is one part of a system that can change.",
            like="a single dial on a kitchen oven.",
        )
        scenes[2] = scenes[2].model_copy(
            update={"primer": [*scenes[2].primer, duplicate_primer]}
        )
        storyline = value.storyline.model_copy(update={"scenes": scenes})

        deduped = StoryOrchestrator._dedupe_primers(storyline)

        all_primer_text = [
            primer.plain for scene in deduped.scenes for primer in scene.primer
        ]
        self.assertEqual(
            len(all_primer_text), len(set(all_primer_text)),
            "duplicate primer wording should have been removed",
        )
        # The original, distinct primers must all survive.
        self.assertIn(
            "A causal chain shows which event makes the next event happen.",
            all_primer_text,
        )

    def test_dedupe_primers_keeps_distinct_terms(self) -> None:
        value = bundle()
        deduped = StoryOrchestrator._dedupe_primers(value.storyline)

        self.assertEqual(
            [scene.primer for scene in deduped.scenes],
            [scene.primer for scene in value.storyline.scenes],
        )

    def test_reconciliation_preserves_missing_slots_and_simulation_scene_type(
        self,
    ) -> None:
        value = bundle()
        simulation_scene = next(
            scene
            for scene in value.storyline.scenes
            if scene.interaction_slot is ActivityKind.SIMULATION
        )
        value.activities.activities = [
            activity
            for activity in value.activities.activities
            if activity.scene_id != simulation_scene.scene_id
        ]

        storyline, _ = StoryOrchestrator._reconcile_activity_slots(
            value.storyline,
            value.activities,
        )
        reconciled = next(
            scene
            for scene in storyline.scenes
            if scene.scene_id == simulation_scene.scene_id
        )

        self.assertIs(reconciled.interaction_slot, ActivityKind.SIMULATION)
        self.assertEqual(reconciled.scene_type, "narrative")

    def test_activity_normalization_repairs_unauditable_internal_condition(
        self,
    ) -> None:
        raw = {
            "activities": [
                {
                    "kind": "simulation",
                    "simulation": {
                        "success_condition": "queue_a + queue_b < capacity",
                        "controls": [
                            {
                                "control_id": "queue_a",
                                "minimum": 1,
                            }
                        ],
                    },
                }
            ]
        }

        normalized = _normalize_activity_output(raw)

        self.assertEqual(
            normalized["activities"][0]["simulation"]["success_condition"],
            "queue_a >= 1",
        )

    def test_refused_requested_cover_blocks_false_success(self) -> None:
        value = bundle()
        audio = next(
            asset.model_dump(mode="json")
            for asset in value.assets
            if asset.kind.value == "audio"
        )

        with self.assertRaisesRegex(
            ValidationFailure, "missing requested cover"
        ):
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

    def test_storyline_preserves_markdown_and_static_code_verbatim(self) -> None:
        paragraphs = [
            'Mateo said, ***“Look here.”*** The **signal** is changing. 🌤️',
            '```python\nprint("hello")\narea = width * height\n```',
            '```mermaid\nflowchart LR\nA["Warm water"] --> B["Cool air"]\n```',
            '- First step\n- Second step\n\n> A useful note.',
            '| Before | After |\n| --- | --- |\n| warm | cool |',
            'Use `2 ** 3` as a small example.',
        ]
        raw = {"scenes": [{"scene_id": "s1", "narrative": list(paragraphs)}]}

        normalized = _normalize_storyline_output(raw)

        self.assertEqual(normalized["scenes"][0]["narrative"], paragraphs)

    def test_blueprint_prose_is_trimmed_to_storyline_limits(self) -> None:
        normalized = _normalize_blueprint_output(
            {
                "title": "t" * 101,
                "tagline": "t" * 181,
                "synopsis": "s" * 361,
                "learning_goal": "g" * 281,
            }
        )

        self.assertEqual(len(normalized["title"]), 100)
        self.assertEqual(len(normalized["tagline"]), 180)
        self.assertEqual(len(normalized["synopsis"]), 360)
        self.assertEqual(len(normalized["learning_goal"]), 280)

    def test_repair_preserves_identity_used_by_generated_cover(self) -> None:
        original = bundle().storyline
        repaired = original.model_copy(
            update={
                "story_id": "renamed-story",
                "title": "A Different Title",
                "synopsis": "A different synopsis that is long enough for the contract. "
                * 2,
                "characters": list(reversed(original.characters)),
            }
        )

        preserved = StoryOrchestrator._preserve_repair_identity(
            repaired,
            original,
        )

        self.assertEqual(preserved.story_id, original.story_id)
        self.assertEqual(preserved.title, original.title)
        self.assertEqual(preserved.synopsis, original.synopsis)
        self.assertEqual(preserved.characters, original.characters)

    def test_image_coverage_adds_cover_and_every_scene(self) -> None:
        value = bundle()
        request = StoryGenerationRequest(
            learner_id="learner",
            idempotency_key="all-scene-images",
            media_budget={
                "max_images": len(value.storyline.scenes) + 1,
                "video": {
                    "enabled": False,
                    "max_clips": 0,
                    "max_total_seconds": 0,
                },
                "generate_background_audio": True,
            },
        )

        plan = StoryOrchestrator._ensure_image_coverage(
            StoryOrchestrator._fallback_media_plan(value.storyline, request),
            value.storyline,
            request,
        )

        self.assertEqual(len(plan.images), len(value.storyline.scenes) + 1)
        self.assertIsNone(plan.images[0].scene_id)
        self.assertEqual(
            [image.scene_id for image in plan.images[1:]],
            [scene.scene_id for scene in value.storyline.scenes],
        )
        cover = plan.images[0]
        self.assertIn(value.storyline.title, cover.prompt)
        self.assertIn(value.storyline.scenes[0].media_cue, cover.prompt)
        self.assertIn(
            value.storyline.characters[0].visual_description,
            cover.prompt,
        )
        self.assertIn("story-specific palette", cover.prompt)
        self.assertIn("not photorealistic", cover.prompt)
        self.assertEqual(
            cover.alt_text,
            (
                f"{value.storyline.characters[0].name} and "
                f"{value.storyline.characters[1].name} confront the opening problem "
                f"in {value.storyline.title}: "
                f"{value.storyline.scenes[0].media_cue}"
            ),
        )

    def test_image_coverage_omits_cover_when_disabled(self) -> None:
        value = bundle()
        request = StoryGenerationRequest(
            learner_id="learner",
            idempotency_key="scene-images-only",
            media_budget={
                "max_images": len(value.storyline.scenes),
                "generate_cover_image": False,
                "video": {
                    "enabled": False,
                    "max_clips": 0,
                    "max_total_seconds": 0,
                },
                "generate_background_audio": False,
            },
        )

        plan = StoryOrchestrator._ensure_image_coverage(
            value.media_plan,
            value.storyline,
            request,
        )

        self.assertEqual(len(plan.images), len(value.storyline.scenes))
        self.assertTrue(all(image.scene_id is not None for image in plan.images))

    def test_image_coverage_omits_all_images_when_disabled(self) -> None:
        value = bundle()
        request = StoryGenerationRequest(
            learner_id="learner",
            idempotency_key="no-generated-images",
            media_budget={
                "max_images": 0,
                "generate_cover_image": False,
                "video": {
                    "enabled": False,
                    "max_clips": 0,
                    "max_total_seconds": 0,
                },
                "generate_background_audio": False,
            },
        )

        plan = StoryOrchestrator._ensure_image_coverage(
            value.media_plan,
            value.storyline,
            request,
        )

        self.assertEqual(plan.images, [])

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

    def test_clamp_citation_refs_drops_out_of_range_indices(self) -> None:
        clamped = StoryOrchestrator._clamp_citation_refs(
            [0, 1, 2, 3, -1], citation_count=2
        )

        self.assertEqual(clamped, [1, 2])

    def test_canonicalize_scene_citations_clamps_scene_and_trivia(self) -> None:
        story = bundle()
        scene = story.storyline.scenes[0].model_copy(
            update={
                "citation_refs": [1, 5],
                "reference_fact_citation_refs": [1, 5],
                "learning_reference": story.storyline.scenes[0].learning_reference.model_copy(
                    update={"citation_refs": [1, 5]}
                ),
                "trivia": (
                    story.storyline.scenes[0].trivia.model_copy(
                        update={"citation_refs": [2, 9]}
                    )
                    if story.storyline.scenes[0].trivia is not None
                    else None
                ),
            }
        )

        canonical = StoryOrchestrator._canonicalize_scene_citations(
            scene, citation_count=1
        )

        self.assertEqual(canonical.citation_refs, [1])
        self.assertEqual(canonical.reference_fact_citation_refs, [1])
        self.assertEqual(canonical.learning_reference.citation_refs, [1])
        if canonical.trivia is not None:
            self.assertEqual(canonical.trivia.citation_refs, [])

    def test_canonicalize_activity_copies_scene_citation_refs(self) -> None:
        story = bundle()
        scene = story.storyline.scenes[0].model_copy(
            update={"citation_refs": [1, 2]}
        )
        activity = story.activities.activities[0]

        canonical = StoryOrchestrator._canonicalize_activity(activity, scene)

        self.assertEqual(canonical.citation_refs, [1, 2])
        self.assertEqual(canonical.activity_id, f"activity-{scene.scene_id}")

    def test_assemble_storyline_clamps_citation_refs_on_all_scenes(self) -> None:
        story = bundle()
        blueprint = story.storyline
        scenes = [
            scene.model_copy(update={"citation_refs": [1, 99]})
            for scene in blueprint.scenes
        ]

        assembled = StoryOrchestrator._assemble_storyline(blueprint, scenes)

        self.assertTrue(len(blueprint.citations) >= 1)
        for scene in assembled.scenes:
            self.assertEqual(scene.citation_refs, [1])

    def test_select_requested_topic_uses_story_brief_as_premise(self) -> None:
        source = SourceEvidence(
            title="A well-supported source",
            url="https://source.test/article",
            excerpt="This source contains enough factual context.",
        )
        request = StoryGenerationRequest(
            learner_id="learner-1",
            idempotency_key="idem-story-brief-test",
            preferred_subjects=[
                SubjectRef(
                    domain="natural sciences",
                    discipline="chemistry",
                    topic_tags=["organic-chemistry"],
                )
            ],
            story_brief=(
                "A chemist at a pharma startup must fix a failing synthesis "
                "route for a life-saving drug before the funding runs out."
            ),
        )
        corpus = ResearchCorpus(query="organic chemistry", sources=[source] * 3)

        selected = StoryOrchestrator._select_requested_topic(request, corpus)

        self.assertEqual(selected.candidate.premise, request.story_brief)

    def test_select_requested_topic_falls_back_without_story_brief(self) -> None:
        source = SourceEvidence(
            title="A well-supported source",
            url="https://source.test/article",
            excerpt="This source contains enough factual context.",
        )
        request = StoryGenerationRequest(
            learner_id="learner-1",
            idempotency_key="idem-no-brief-test",
            preferred_subjects=[
                SubjectRef(
                    domain="natural sciences",
                    discipline="chemistry",
                    topic_tags=["organic-chemistry"],
                )
            ],
        )
        corpus = ResearchCorpus(query="organic chemistry", sources=[source] * 3)

        selected = StoryOrchestrator._select_requested_topic(request, corpus)

        self.assertIn("chemistry", selected.candidate.premise)

    def test_select_requested_topic_preserves_parent_topic(self) -> None:
        source = SourceEvidence(
            title="A well-supported source",
            url="https://source.test/article",
            excerpt="This source contains enough factual context.",
        )
        subject = SubjectRef(
            domain="history",
            discipline="Silk Route",
            topic_tags=["trade networks", "cultural exchange"],
        )
        request = StoryGenerationRequest(
            learner_id="learner-1",
            idempotency_key="idem-parent-topic-test",
            preferred_subjects=[subject],
        )
        corpus = ResearchCorpus(query="Silk Route", sources=[source] * 3)

        selected = StoryOrchestrator._select_requested_topic(request, corpus)

        self.assertEqual(selected.candidate.title, "Silk Route")
        self.assertEqual(selected.candidate.subject.domain, "history")
        self.assertEqual(selected.candidate.subject.discipline, "Silk Route")
        self.assertEqual(
            selected.candidate.subject.topic_tags,
            ["trade networks", "cultural exchange"],
        )


class OrchestratorResumeTests(unittest.IsolatedAsyncioTestCase):
    async def test_image_node_generates_only_missing_checkpoint_asset(
        self,
    ) -> None:
        value = bundle()
        plan = value.media_plan.model_copy(
            update={"images": value.media_plan.images[:2], "audio": None}
        )
        image_assets = [
            asset for asset in value.assets if asset.kind.value == "image"
        ]
        asset_by_key = {asset.asset_key: asset for asset in image_assets}
        cached = asset_by_key[plan.images[0].asset_key]
        generated = asset_by_key[plan.images[1].asset_key]
        runtime = SimpleNamespace(
            checkpoints={
                "job": {"image_assets": [cached.model_dump(mode="json")]}
            },
            media=SimpleNamespace(generate_image=AsyncMock(return_value=b"image")),
            backend=SimpleNamespace(
                upload_asset=AsyncMock(return_value=generated)
            ),
        )
        node = ImageGenerationAgent(name="images", runtime=runtime)

        with patch(
            "artham_partner.story_pipeline.nodes.asyncio.sleep",
            new=AsyncMock(),
        ):
            outputs = [
                output
                async for output in node.run_node_impl(
                    ctx=None,  # type: ignore[arg-type]
                    node_input={
                        "job_id": "job",
                        "media_plan": plan.model_dump(mode="json"),
                    },
                )
            ]

        self.assertEqual(
            {asset.asset_key for asset in outputs[0]},
            {request.asset_key for request in plan.images},
        )
        runtime.media.generate_image.assert_awaited_once_with(
            plan.images[1], reference=None
        )

    async def test_cover_binary_becomes_style_reference_for_scene_images(
        self,
    ) -> None:
        value = bundle()
        plan = value.media_plan.model_copy(
            update={"images": value.media_plan.images[:2], "audio": None}
        )
        image_assets = [
            asset for asset in value.assets if asset.kind.value == "image"
        ]
        asset_by_key = {asset.asset_key: asset for asset in image_assets}
        cover_binary = GeneratedBinary(
            data=b"cover-bytes",
            content_type="image/webp",
            provider_model="gemini-3.1-flash-lite-image",
        )
        scene_binary = GeneratedBinary(
            data=b"scene-bytes",
            content_type="image/webp",
            provider_model="gemini-3.1-flash-lite-image",
        )
        runtime = SimpleNamespace(
            checkpoints={},
            media=SimpleNamespace(
                generate_image=AsyncMock(
                    side_effect=[cover_binary, scene_binary]
                )
            ),
            backend=SimpleNamespace(
                upload_asset=AsyncMock(
                    side_effect=[
                        asset_by_key[plan.images[0].asset_key],
                        asset_by_key[plan.images[1].asset_key],
                    ]
                )
            ),
        )
        node = ImageGenerationAgent(name="images", runtime=runtime)

        with patch(
            "artham_partner.story_pipeline.nodes.asyncio.sleep",
            new=AsyncMock(),
        ):
            [
                output
                async for output in node.run_node_impl(
                    ctx=None,  # type: ignore[arg-type]
                    node_input={
                        "job_id": "job",
                        "media_plan": plan.model_dump(mode="json"),
                    },
                )
            ]

        first_call, second_call = runtime.media.generate_image.await_args_list
        self.assertIsNone(first_call.kwargs["reference"])
        self.assertIs(second_call.kwargs["reference"], cover_binary)

    async def test_validated_checkpoint_retries_only_persistence(self) -> None:
        value = bundle()
        report = ValidationReport(
            is_valid=True,
            quality_score=95,
            factual_grounding_summary="Sources support all material factual claims.",
            safety_summary="The story is safe and appropriate for the learner.",
        )
        runtime = SimpleNamespace(
            settings=settings(),
            checkpoints={
                "job": {
                    "validated_bundle": value.model_dump(mode="json"),
                    "validation_report": report.model_dump(mode="json"),
                    "repair_cycles": 1,
                }
            },
            exa=SimpleNamespace(),
            backend=SimpleNamespace(),
            vertex=SimpleNamespace(),
        )
        expected = StoryGenerationResult(
            job_id="job",
            receipt=PersistenceReceipt(
                story_id="story",
                version=1,
                persisted_at=datetime.now(UTC),
            ),
            validation=report,
            repair_cycles=1,
        )
        orchestrator = StoryOrchestrator(runtime)  # type: ignore[arg-type]

        with patch.object(
            orchestrator,
            "_persist",
            new=AsyncMock(return_value=expected),
        ) as persist:
            result = await orchestrator.generate(
                ctx=None,  # type: ignore[arg-type]
                request=StoryGenerationRequest(
                    learner_id="learner",
                    idempotency_key="retry-key",
                ),
                job_id="job",
            )

        self.assertEqual(result, expected)
        persist.assert_awaited_once()


class StructuredOutputRetryTests(unittest.IsolatedAsyncioTestCase):
    async def test_repair_result_normalizes_nested_storyline(self) -> None:
        value = bundle()
        output = {
            "storyline": value.storyline.model_dump(mode="json"),
            "activities": value.activities.model_dump(mode="json"),
            "media_plan": value.media_plan.model_dump(mode="json"),
            "change_notes": ["Simplified the explanation."],
        }
        output["storyline"]["synopsis"] = "A long future-world synopsis. " * 20

        class FakeAgent:
            name = "story_repairer"

        class FakeContext:
            async def run_node(self, _agent, *, node_input, use_sub_branch):
                return output

        orchestrator = StoryOrchestrator.__new__(StoryOrchestrator)
        result = await orchestrator._run_llm(
            FakeContext(),
            FakeAgent(),
            {"bundle": value.model_dump(mode="json")},
            RepairResult,
        )

        self.assertLessEqual(len(result.storyline.synopsis), 360)

    async def test_unknown_nested_activity_key_is_ignored(self) -> None:
        class FakeAgent:
            name = "activity_chunk_worker"

        class FakeContext:
            async def run_node(self, _agent, *, node_input, use_sub_branch):
                return {
                    "activity_id": "activity-scene-1",
                    "scene_id": "scene-1",
                    "kind": "quiz",
                    "learning_objective": "Distinguish the causal explanations.",
                    "quiz": {
                        "prompt": "Which observation best separates the causes?",
                        "options": [
                            {"option_id": "a", "label": "First explanation"},
                            {
                                "option_id": "b",
                                "label": "Second explanation",
                                "},{": "option-2",
                            },
                            {"option_id": "c", "label": "Third explanation"},
                            {"option_id": "d", "label": "Fourth explanation"},
                        ],
                        "correct_option_ids": ["b"],
                        "explanation": "The second observation isolates the cause.",
                    },
                }

        orchestrator = StoryOrchestrator.__new__(StoryOrchestrator)
        result = await orchestrator._run_llm(
            FakeContext(),
            FakeAgent(),
            {"scene": {"scene_id": "scene-1"}},
            ActivitySpec,
        )

        self.assertEqual(
            {option.option_id for option in result.quiz.options},
            {"a", "b", "c", "d"},
        )
        for option in result.quiz.options:
            self.assertEqual(set(option.model_dump()), {"option_id", "label"})

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
