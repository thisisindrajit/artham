from __future__ import annotations

import unittest

from artham_partner.story_pipeline.contracts import (
    RepairComponent,
    StoryGenerationRequest,
    ValidationIssue,
    ValidationReport,
    ValidationSeverity,
)
from artham_partner.story_pipeline.validation import (
    deterministic_issues,
    merge_validation_reports,
)

from tests.helpers import bundle


class ValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.request = StoryGenerationRequest(
            learner_id="learner-123",
            idempotency_key="request-key",
            target_age=18,
            media_budget={"max_images": 8},
        )

    def test_valid_bundle_passes_deterministic_checks(self) -> None:
        self.assertEqual(deterministic_issues(bundle(), self.request), [])

    def test_scene_cannot_stack_three_learning_blocks(self) -> None:
        value = bundle()
        value.storyline.scenes[0].trivia = value.storyline.scenes[1].trivia
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("TOO_MANY_LEARNING_BLOCKS", codes)

    def test_unreachable_scene_is_rejected(self) -> None:
        value = bundle()
        value.storyline.scenes[1].next_scene_id = "s5"
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("UNREACHABLE_SCENES", codes)

    def test_citation_must_match_canonical_exa_evidence(self) -> None:
        value = bundle()
        value.storyline.citations[0] = value.storyline.citations[0].model_copy(
            update={
                "excerpt": (
                    "Fabricated evidence retained under an otherwise approved "
                    "URL."
                )
            }
        )
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("UNAPPROVED_CITATION_EVIDENCE", codes)

    def test_story_can_release_with_missing_scene_images(self) -> None:
        value = bundle()
        value.media_plan.images.pop()
        value.assets.pop()
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertNotIn("INVALID_SCENE_IMAGE_LINKS", codes)

    def test_story_can_release_without_a_cover_image(self) -> None:
        value = bundle()
        value.media_plan.images = [
            image for image in value.media_plan.images if image.scene_id is not None
        ]
        value.assets = [
            asset for asset in value.assets if asset.scene_id is not None
        ]
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertNotIn("INVALID_COVER_IMAGE_COUNT", codes)

    def test_story_requires_two_distinct_learning_references(self) -> None:
        value = bundle()
        value.storyline.scenes[1].learning_reference = None
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("LEARNING_REFERENCE_COUNT", codes)

        value = bundle()
        value.storyline.scenes[1].learning_reference = (
            value.storyline.scenes[0].learning_reference
        )
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("DUPLICATE_LEARNING_REFERENCE", codes)

    def test_short_story_can_use_one_simulation(self) -> None:
        value = bundle()
        value.storyline.scenes[4].interaction_slot = None
        value.activities.activities = [
            activity
            for activity in value.activities.activities
            if activity.scene_id != "s5"
        ]
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertNotIn("INSUFFICIENT_SIMULATIONS", codes)

    def test_simulation_readout_must_be_executable_and_truthful(self) -> None:
        value = bundle()
        simulation = value.activities.activities[1].simulation
        simulation.readouts = []
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("MISSING_SIMULATION_READOUT", codes)

        value = bundle()
        simulation = value.activities.activities[1].simulation
        simulation.success_condition = "input == 5.5"
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("UNREACHABLE_SIMULATION_SUCCESS", codes)

        value = bundle()
        simulation = value.activities.activities[1].simulation
        simulation.readouts[0].success_value = "110"
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("SIMULATION_PROMISE_MISMATCH", codes)

        value = bundle()
        simulation = value.activities.activities[1].simulation
        simulation.readouts[0].operation = "linear"
        simulation.readouts[0].params = {}
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("INVALID_SIMULATION_READOUT", codes)

    def test_simulation_rejects_target_dials_without_causal_readouts(self) -> None:
        value = bundle()
        simulation = value.activities.activities[1].simulation
        simulation.controls = simulation.controls[:1]
        simulation.readouts[0].operation = "identity"
        simulation.readouts[0].input_ids = ["input"]
        simulation.readouts[0].params = {}
        simulation.readouts[0].success_value = "6"
        simulation.success_condition = "input >= 6"
        simulation.guide.watch = "Watch the input reach 6."

        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }

        self.assertIn("TRIVIAL_SIMULATION_CONTROLS", codes)
        self.assertIn("TRIVIAL_SIMULATION_READOUT", codes)

    def test_base_three_readout_proves_twelve_becomes_110(self) -> None:
        value = bundle()
        simulation = value.activities.activities[1].simulation
        simulation.controls[0].maximum = 15
        simulation.success_condition = "input == 12"
        readout = simulation.readouts[0]
        readout.operation = "base_conversion"
        readout.input_ids = ["input"]
        readout.params = {"radix": 3}
        readout.success_value = "110"
        simulation.guide.watch = "Watch the live output become 110."

        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertNotIn("SIMULATION_PROMISE_MISMATCH", codes)
        self.assertNotIn("UNREACHABLE_SIMULATION_SUCCESS", codes)

    def test_story_can_release_when_optional_audio_fails(self) -> None:
        value = bundle()
        value.media_plan.audio = None
        value.assets = [
            asset for asset in value.assets if asset.kind.value != "audio"
        ]
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertNotIn("MISSING_BACKGROUND_AUDIO", codes)

    def test_background_audio_requires_beatless_ethereal_mood_direction(self) -> None:
        value = bundle()
        value.media_plan.audio.prompt = (
            "A generic loopable instrumental background track for the story."
        )
        value.media_plan.audio.negative_prompt = ""
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("AUDIO_MISSING_ETHEREAL_MOOD", codes)

    def test_school_participant_premise_is_rejected(self) -> None:
        value = bundle()
        value.storyline.intro.role = "science club assistant"
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("NON_PROFESSIONAL_PREMISE", codes)

    def test_every_image_names_a_recurring_character(self) -> None:
        value = bundle()
        value.media_plan.images[0].prompt = (
            "A technical close-up of a control board with one unusual signal, "
            "shown without any people, logos, labels, or readable text."
        )
        issues = deterministic_issues(value, self.request)
        issue = next(
            issue
            for issue in issues
            if issue.code == "IMAGE_MISSING_RECURRING_CHARACTER"
        )
        self.assertEqual(issue.severity, ValidationSeverity.WARNING)

    def test_two_missing_scene_images_are_a_warning(self) -> None:
        value = bundle()
        value.media_plan.images = [
            image
            for image in value.media_plan.images
            if image.scene_id not in {"s1", "s2"}
        ]
        value.assets = [
            asset
            for asset in value.assets
            if asset.scene_id not in {"s1", "s2"}
        ]

        issues = deterministic_issues(value, self.request)
        partial = next(
            issue
            for issue in issues
            if issue.code == "PARTIAL_STORY_IMAGE_COVERAGE"
        )
        self.assertEqual(partial.severity, ValidationSeverity.WARNING)

    def test_semantic_and_deterministic_reports_are_merged(self) -> None:
        semantic = ValidationReport(
            is_valid=True,
            quality_score=90,
            issues=[
                ValidationIssue(
                    code="MINOR_WORDING",
                    severity=ValidationSeverity.WARNING,
                    component=RepairComponent.STORYLINE,
                    path="storyline.tagline",
                    message="The tagline could be more concrete.",
                    repair_instruction="Name the signal in the tagline.",
                )
            ],
            factual_grounding_summary="The included claims are grounded.",
            safety_summary="The story is suitable for the target age.",
        )
        deterministic = [
            ValidationIssue(
                code="BROKEN_TEST",
                severity=ValidationSeverity.ERROR,
                component=RepairComponent.STORYLINE,
                path="storyline.scenes",
                message="A deterministic invariant is broken.",
                repair_instruction="Restore the required graph invariant.",
            )
        ]
        merged = merge_validation_reports(semantic, deterministic)
        self.assertFalse(merged.is_valid)
        self.assertEqual(merged.quality_score, 60)


if __name__ == "__main__":
    unittest.main()
