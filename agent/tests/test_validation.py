from __future__ import annotations

import unittest

from artham_partner.story_pipeline.contracts import (
    ActivityKind,
    Difficulty,
    RepairComponent,
    StoryGenerationRequest,
    SubjectRef,
    ValidationIssue,
    ValidationReport,
    ValidationSeverity,
)
from artham_partner.story_pipeline.validation import (
    bounded_release_report,
    deterministic_issues,
    merge_validation_reports,
    salvaged_release,
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
        value = bundle()
        value.media_plan.images = [
            image for image in value.media_plan.images if image.scene_id is None
        ]
        value.assets = [
            asset
            for asset in value.assets
            if asset.kind.value != "image" or asset.scene_id is None
        ]

        self.assertEqual(deterministic_issues(value, self.request), [])

    def test_story_without_quiz_is_rejected(self) -> None:
        value = bundle()
        quiz_scene = next(
            scene
            for scene in value.storyline.scenes
            if scene.interaction_slot is ActivityKind.QUIZ
        )
        quiz_scene.interaction_slot = ActivityKind.REFLECTION
        quiz_activity = next(
            activity
            for activity in value.activities.activities
            if activity.scene_id == quiz_scene.scene_id
        )
        quiz_activity.kind = ActivityKind.REFLECTION
        quiz_activity.quiz = None
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("MISSING_REQUIRED_QUIZ", codes)

    def test_story_without_simulation_is_rejected(self) -> None:
        value = bundle()
        simulation_scene_ids = {
            scene.scene_id
            for scene in value.storyline.scenes
            if scene.interaction_slot is ActivityKind.SIMULATION
        }
        for scene in value.storyline.scenes:
            if scene.scene_id in simulation_scene_ids:
                scene.interaction_slot = ActivityKind.REFLECTION
        for activity in value.activities.activities:
            if activity.scene_id in simulation_scene_ids:
                activity.kind = ActivityKind.REFLECTION
                activity.simulation = None

        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }

        self.assertIn("MISSING_REQUIRED_SIMULATION", codes)

    def test_readability_is_not_inferred_from_sentence_length_or_markdown(self) -> None:
        passages = [
            "You place the warm cup next to the cool cup and wait while heat "
            "moves from the warmer water into the cooler air around it.",
            '*"Watch the warm water,"* Mira says. *"It gives heat to the cooler '
            'air around the cup, just as your warm hands do on a cold day."*',
            "| Before | After |\n| --- | --- |\n"
            "| The water is warmer than the air | Heat moves into the cooler air |\n"
            "| The water cools slowly | You can feel less warmth near the cup |",
            "```mermaid\nflowchart LR\n"
            'A["The water is warmer than the air around the cup"] --> '
            'B["Heat moves from the warm water into the cooler air"]\n```',
        ]
        for passage in passages:
            with self.subTest(passage=passage):
                value = bundle()
                value.storyline.scenes[0].narrative = [passage]
                self.assertNotIn(
                    "NARRATIVE_TOO_COMPLEX",
                    {issue.code for issue in deterministic_issues(value, self.request)},
                )

    def test_requested_parent_topic_is_preserved(self) -> None:
        value = bundle()
        subject = SubjectRef(
            domain="history",
            discipline="Silk Route",
            topic_tags=["cultural exchange"],
        )
        self.request.preferred_subjects = [subject]
        value.selected_topic.candidate.subject = subject
        value.storyline.subject = subject
        self.assertEqual(deterministic_issues(value, self.request), [])

        value.storyline.subject = subject.model_copy(update={"discipline": "History"})
        self.assertIn(
            "STORY_SUBJECT_MISMATCH",
            {issue.code for issue in deterministic_issues(value, self.request)},
        )
        value.selected_topic.candidate.subject = value.storyline.subject
        self.assertIn(
            "REQUESTED_SUBJECT_MISMATCH",
            {issue.code for issue in deterministic_issues(value, self.request)},
        )

    def test_requested_difficulty_is_checked_without_restricting_adaptive(self) -> None:
        for requested in Difficulty:
            for generated in Difficulty:
                with self.subTest(requested=requested, generated=generated):
                    value = bundle()
                    self.request.difficulty = requested
                    value.storyline.difficulty = generated
                    codes = {
                        issue.code for issue in deterministic_issues(value, self.request)
                    }
                    self.assertEqual(
                        "REQUESTED_DIFFICULTY_MISMATCH" in codes,
                        requested is not Difficulty.ADAPTIVE and generated is not requested,
                    )

    def test_scene_cannot_stack_three_learning_blocks(self) -> None:
        value = bundle()
        value.storyline.scenes[0].trivia = value.storyline.scenes[1].trivia
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("TOO_MANY_LEARNING_BLOCKS", codes)

    def test_story_requires_four_primers_across_three_scenes(self) -> None:
        value = bundle()
        value.storyline.scenes[4].primer = []
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("INSUFFICIENT_PRIMERS", codes)
        issue = next(
            issue for issue in deterministic_issues(value, self.request)
            if issue.code == "INSUFFICIENT_PRIMERS"
        )
        self.assertIn("distinct useful ideas", issue.repair_instruction)
        self.assertIn("do not invent technical terms", issue.repair_instruction)

    def test_story_limits_trivia_to_five_cards(self) -> None:
        value = bundle()
        value.storyline.scenes[5].trivia = value.storyline.scenes[1].trivia
        value.storyline.scenes[3].trivia = value.storyline.scenes[1].trivia
        value.storyline.scenes[6].trivia = value.storyline.scenes[1].trivia
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertIn("INSUFFICIENT_TRIVIA", codes)

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
        request = self.request.model_copy(
            update={
                "media_budget": self.request.media_budget.model_copy(
                    update={"generate_cover_image": False}
                )
            }
        )
        codes = {
            issue.code for issue in deterministic_issues(value, request)
        }
        self.assertNotIn("MISSING_COVER_IMAGE", codes)
        self.assertNotIn("UNREQUESTED_COVER_IMAGE", codes)

    def test_story_requires_cover_when_requested(self) -> None:
        value = bundle()
        value.media_plan.images = [
            image for image in value.media_plan.images if image.scene_id is not None
        ]

        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }

        self.assertIn("MISSING_COVER_IMAGE", codes)

    def test_story_allows_no_learning_references_but_rejects_duplicates(self) -> None:
        value = bundle()
        for scene in value.storyline.scenes:
            scene.learning_reference = None
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertNotIn("LEARNING_REFERENCE_COUNT", codes)

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

    def test_simulation_controls_require_explanations(self) -> None:
        value = bundle()
        simulation = value.activities.activities[1].simulation
        simulation.controls[0].description = ""

        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }

        self.assertIn("MISSING_SIMULATION_CONTROL_DESCRIPTION", codes)

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

    def test_learner_agency_is_not_inferred_from_other_characters_role_words(self) -> None:
        value = bundle()
        value.storyline.intro.role = "Museum curator"
        value.storyline.intro.text = [
            "You lead the museum team. Your assistant brings a visitor's question "
            "about an old classroom display, and you decide what to investigate."
        ]
        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertNotIn("NON_PROFESSIONAL_PREMISE", codes)

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

    def test_scene_images_are_allowed(self) -> None:
        value = bundle()

        codes = {
            issue.code for issue in deterministic_issues(value, self.request)
        }
        self.assertNotIn("SCENE_IMAGES_DISABLED", codes)

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

    def test_readability_findings_are_advisory_even_if_critic_calls_them_errors(self) -> None:
        issue = ValidationIssue(
            code="NARRATIVE_TOO_COMPLEX",
            severity=ValidationSeverity.ERROR,
            component=RepairComponent.STORYLINE,
            path="storyline.scenes[s1].narrative",
            message="A sentence exceeds the old 22-word limit.",
            repair_instruction="Shorten the sentence.",
        )
        semantic = ValidationReport(
            is_valid=False,
            quality_score=90,
            issues=[issue],
            factual_grounding_summary="The claims are grounded.",
            safety_summary="The story is age-appropriate.",
        )
        for deterministic in ([], [issue]):
            with self.subTest(deterministic=bool(deterministic)):
                merged = merge_validation_reports(semantic, deterministic)
                self.assertTrue(merged.is_valid)
                self.assertEqual(merged.quality_score, 90)
                self.assertTrue(all(
                    item.severity is ValidationSeverity.WARNING for item in merged.issues
                ))

    def test_advisory_deterministic_findings_do_not_cap_quality_score(self) -> None:
        value = bundle()
        value.activities.activities[1].simulation.readouts[0].success_value = "110"
        issues = deterministic_issues(value, self.request)
        self.assertTrue(issues)
        self.assertTrue(all(
            issue.severity is ValidationSeverity.WARNING for issue in issues
        ))
        semantic = ValidationReport(
            is_valid=True,
            quality_score=90,
            issues=[],
            factual_grounding_summary="The claims are grounded.",
            safety_summary="The story is age-appropriate.",
        )
        merged = merge_validation_reports(semantic, issues)
        self.assertTrue(merged.is_valid)
        self.assertEqual(merged.quality_score, 90)

    def test_relaxed_readability_keeps_substantive_teaching_findings(self) -> None:
        for code in ("ASSUMED_PRIOR_KNOWLEDGE", "MISLEADING_SIMPLIFICATION"):
            with self.subTest(code=code):
                issue = ValidationIssue(
                    code=code,
                    severity=ValidationSeverity.ERROR,
                    component=RepairComponent.STORYLINE,
                    path="storyline.scenes[s1].narrative",
                    message="The explanation skips or misstates the causal mechanism.",
                    repair_instruction="Explain the source-supported mechanism before use.",
                )
                semantic = ValidationReport(
                    is_valid=False,
                    quality_score=70,
                    issues=[issue],
                    factual_grounding_summary="The explanation needs correction.",
                    safety_summary="The story is age-appropriate.",
                )
                merged = merge_validation_reports(semantic, [])
                self.assertFalse(merged.is_valid)
                self.assertEqual(merged.issues, [issue])

    def test_low_quality_story_is_released_with_a_warning(self) -> None:
        report = ValidationReport(
            is_valid=True,
            quality_score=60,
            issues=[],
            factual_grounding_summary=(
                "The supplied sources support the material factual claims."
            ),
            safety_summary=(
                "The story is suitable for the requested learner age."
            ),
        )

        bounded = bounded_release_report(report, [])

        self.assertTrue(bounded.is_valid)
        self.assertEqual(bounded.quality_score, 60)

    def test_invented_semantic_codes_never_block_release(self) -> None:
        opinions = [
            ValidationIssue(
                code=code,
                severity=ValidationSeverity.ERROR,
                component=RepairComponent.STORYLINE,
                path="storyline",
                message="The semantic validator raised a subjective concern.",
                repair_instruction="Improve the flagged narrative quality.",
            )
            for code in (
                "TRIVIA_NOT_SURPRISING",
                "SIMULATION_NOT_STORY_NATIVE",
                "STORY_CONCEPT_SCOPE_DRIFT",
                "REFERENCE_EXPLANATION_GENERIC",
            )
        ]
        report = ValidationReport(
            is_valid=False,
            quality_score=55,
            issues=opinions,
            factual_grounding_summary=(
                "The supplied sources support the material factual claims."
            ),
            safety_summary=(
                "The story is suitable for the requested learner age."
            ),
        )

        bounded = bounded_release_report(report, [])

        self.assertTrue(bounded.is_valid)
        self.assertTrue(
            all(
                issue.severity is ValidationSeverity.WARNING
                for issue in bounded.issues
            )
        )

    def test_safety_findings_still_block_release(self) -> None:
        report = ValidationReport(
            is_valid=False,
            quality_score=90,
            issues=[
                ValidationIssue(
                    code="AGE_INAPPROPRIATE_CONTENT",
                    severity=ValidationSeverity.ERROR,
                    component=RepairComponent.STORYLINE,
                    path="storyline.scenes[2]",
                    message="A scene describes content unsuitable for the age.",
                    repair_instruction="Rewrite the scene for the requested age.",
                )
            ],
            factual_grounding_summary=(
                "The supplied sources support the material factual claims."
            ),
            safety_summary="A scene is unsuitable for the requested age.",
        )

        bounded = bounded_release_report(report, [])

        self.assertFalse(bounded.is_valid)

    def test_salvage_drops_only_the_broken_activity(self) -> None:
        value = bundle()
        broken = value.activities.activities[1]
        report = ValidationReport(
            is_valid=False,
            quality_score=70,
            issues=[
                ValidationIssue(
                    code="UNKNOWN_SIMULATION_CONTROL",
                    severity=ValidationSeverity.ERROR,
                    component=RepairComponent.ACTIVITIES,
                    path=f"activities[{broken.activity_id}].simulation.readouts",
                    message="A readout references a control that does not exist.",
                    repair_instruction="Reference only declared control ids.",
                )
            ],
            factual_grounding_summary=(
                "The supplied sources support the material factual claims."
            ),
            safety_summary=(
                "The story is suitable for the requested learner age."
            ),
        )

        salvaged, bounded = salvaged_release(
            value,
            self.request,
            report,
        )

        self.assertNotIn(
            "UNKNOWN_SIMULATION_CONTROL",
            {
                issue.code
                for issue in bounded.issues
                if issue.severity is ValidationSeverity.ERROR
            },
        )
        self.assertNotIn(
            broken.activity_id,
            {item.activity_id for item in salvaged.activities.activities},
        )
        self.assertEqual(
            len(salvaged.activities.activities),
            len(value.activities.activities) - 1,
        )
        cleared = next(
            scene
            for scene in salvaged.storyline.scenes
            if scene.scene_id == broken.scene_id
        )
        self.assertIsNone(cleared.interaction_slot)


if __name__ == "__main__":
    unittest.main()
