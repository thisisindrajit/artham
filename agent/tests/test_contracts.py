from __future__ import annotations

import unittest

from pydantic import ValidationError

from artham_partner.story_pipeline.contracts import (
    ActivityKind,
    ActivityPlan,
    ActivitySpec,
    EmbeddingRecord,
    MediaBudget,
    SceneDraft,
    StoryBlueprint,
    StoryGenerationRequest,
    SubjectRef,
    SimulationReadout,
    VideoBudget,
    VideoRequest,
)
from tests.helpers import bundle


class ContractTests(unittest.TestCase):
    def test_generation_request_enforces_target_age(self) -> None:
        for age in (12, 19):
            with self.assertRaises(ValidationError):
                StoryGenerationRequest(
                    learner_id="learner",
                    idempotency_key="request-key",
                    target_age=age,
                )

    def test_disabled_video_budget_requires_zero_limits(self) -> None:
        with self.assertRaises(ValidationError):
            VideoBudget(enabled=False)
        budget = VideoBudget(
            enabled=False,
            max_clips=0,
            max_total_seconds=0,
        )
        self.assertFalse(budget.enabled)

    def test_media_budget_allows_no_images_when_cover_is_disabled(self) -> None:
        budget = MediaBudget(max_images=0, generate_cover_image=False)
        self.assertEqual(budget.max_images, 0)

    def test_media_budget_requires_a_slot_for_requested_cover(self) -> None:
        with self.assertRaises(ValidationError):
            MediaBudget(max_images=0, generate_cover_image=True)

    def test_activity_kind_requires_matching_payload(self) -> None:
        with self.assertRaises(ValidationError):
            ActivitySpec(
                activity_id="a1",
                scene_id="s1",
                kind=ActivityKind.QUIZ,
                learning_objective="Use evidence.",
            )

    def test_activity_discards_payloads_that_do_not_match_kind(self) -> None:
        raw = bundle().activities.activities[0].model_dump(mode="json")
        raw["reflection"] = {"invalid": "payload"}

        activity = ActivitySpec.model_validate(raw)

        self.assertIsNone(activity.reflection)

    def test_generated_activity_prose_is_not_length_rejected(self) -> None:
        value = bundle().activities.model_dump(mode="json")
        simulation = next(
            activity["simulation"]
            for activity in value["activities"]
            if activity["kind"] == "simulation"
        )
        simulation["readouts"][0]["fallback"] = "A" * 500

        plan = ActivityPlan.model_validate(value)

        self.assertEqual(len(plan.activities[1].simulation.readouts[0].fallback), 500)

    def test_embedding_dimensions_must_match(self) -> None:
        with self.assertRaises(ValidationError):
            EmbeddingRecord(
                embedding_id="e1",
                content_key="story:s1",
                content_type="story",
                text="Story text",
                vector=[0.1, 0.2],
                dimensions=3,
                model="embedding-model",
            )

    def test_scene_beat_is_brief_enough_for_the_header(self) -> None:
        scene = bundle().storyline.scenes[0].model_dump()
        scene["beat"] = "A chapter name that is much too long " * 6

        with self.assertRaises(ValidationError):
            SceneDraft.model_validate(scene)

    def test_scene_narrative_matches_backend_paragraph_limit(self) -> None:
        scene = bundle().storyline.scenes[0].model_dump()
        scene["narrative"] = ["A concise paragraph."] * 9

        with self.assertRaises(ValidationError):
            SceneDraft.model_validate(scene)

    def test_subject_discipline_is_at_most_four_words(self) -> None:
        with self.assertRaises(ValidationError):
            SubjectRef(
                domain="biology",
                discipline="Molecular data storage in living cells",
            )

    def test_subject_discipline_allows_a_specific_topic(self) -> None:
        subject = SubjectRef(domain="Math", discipline="Fourier transforms")
        self.assertEqual(subject.discipline, "Fourier transforms")

    def test_subject_discipline_allows_ampersand_connector(self) -> None:
        subject = SubjectRef(
            domain="Math",
            discipline="Probability & statistics",
            topic_tags=["Bayesian networks"],
        )

        self.assertEqual(subject.discipline, "Probability & statistics")

    def test_blueprint_requires_quiz_and_simulation(self) -> None:
        value = bundle()
        blueprint = {
            **value.storyline.model_dump(exclude={"scenes"}),
            "continuity_bible": "Keep the cast and setting consistent.",
            "scenes": [
                {
                    "scene_id": scene.scene_id,
                    "position": index,
                    "act": scene.act,
                    "title": scene.title,
                    "beat": scene.beat,
                    "narrative_goal": scene.learning_purpose,
                    "learning_purpose": scene.learning_purpose,
                    "required_facts": ["A supported fact."],
                    "character_names": [],
                    "interaction_slot": (
                        "reflection"
                        if scene.interaction_slot in {
                            ActivityKind.QUIZ,
                            ActivityKind.SIMULATION,
                        }
                        else scene.interaction_slot
                    ),
                    "next_scene_id": scene.next_scene_id,
                    "scene_type": (
                        "ending" if scene.scene_type == "ending" else "reflect"
                    ),
                    "mood": scene.mood,
                    "concept": scene.concept,
                    "include_primer": bool(scene.primer),
                    "include_trivia": bool(scene.trivia),
                    "trivia_fact": scene.trivia.text if scene.trivia else None,
                    "reference_subject": None,
                    "outcome": scene.outcome,
                }
                for index, scene in enumerate(value.storyline.scenes)
            ],
        }

        with self.assertRaisesRegex(ValidationError, "at least one quiz"):
            StoryBlueprint.model_validate(blueprint)

    def test_veo_duration_uses_supported_values(self) -> None:
        with self.assertRaises(ValidationError):
            VideoRequest(
                asset_key="clip",
                scene_id="s1",
                prompt=(
                    "Fictional security-camera footage showing a mechanism "
                    "changing over time without people or readable text."
                ),
                narrative_necessity=(
                    "Motion reveals the order of events that a still cannot."
                ),
                duration_seconds=10,
            )

    def test_veo_requires_widescreen_aspect_ratio(self) -> None:
        with self.assertRaises(ValidationError):
            VideoRequest(
                asset_key="clip",
                scene_id="s1",
                prompt=(
                    "Fictional footage showing two student investigators changing "
                    "a simple circuit over time without readable text."
                ),
                narrative_necessity=(
                    "Motion reveals the order of events that a still cannot."
                ),
                aspect_ratio="9:16",
            )


if __name__ == "__main__":
    unittest.main()
