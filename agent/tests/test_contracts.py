from __future__ import annotations

import unittest

from pydantic import ValidationError

from artham_partner.story_pipeline.contracts import (
    ActivityKind,
    ActivitySpec,
    EmbeddingRecord,
    SceneDraft,
    StoryGenerationRequest,
    SubjectRef,
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

    def test_activity_kind_requires_matching_payload(self) -> None:
        with self.assertRaises(ValidationError):
            ActivitySpec(
                activity_id="a1",
                scene_id="s1",
                kind=ActivityKind.QUIZ,
                learning_objective="Use evidence.",
            )

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
        scene["beat"] = "A chapter name that is much too long"

        with self.assertRaises(ValidationError):
            SceneDraft.model_validate(scene)

    def test_subject_discipline_is_at_most_two_words(self) -> None:
        with self.assertRaises(ValidationError):
            SubjectRef(domain="biology", discipline="Molecular data storage")

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
