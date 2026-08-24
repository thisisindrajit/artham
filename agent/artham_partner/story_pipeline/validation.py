"""Deterministic release checks and semantic-validator report merging."""

from __future__ import annotations

import re

from .constants import (
    ALLOWED_AUDIO_MIME_TYPES,
    ALLOWED_IMAGE_MIME_TYPES,
    ALLOWED_VIDEO_MIME_TYPES,
    MAX_MISSING_SCENE_IMAGES,
)
from .contracts import (
    ActivityPlan,
    ActivityKind,
    AssetKind,
    GeneratedStoryBundle,
    RepairComponent,
    SimulationControl,
    SimulationReadout,
    StoryGenerationRequest,
    ValidationIssue,
    ValidationReport,
    ValidationSeverity,
)

_CONDITION_CLAUSE = re.compile(
    r"^\s*([a-z][a-z0-9_]*)\s*(==|>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)\s*$",
    re.IGNORECASE,
)


def deterministic_issues(
    bundle: GeneratedStoryBundle, request: StoryGenerationRequest
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []

    def error(
        code: str,
        component: RepairComponent,
        path: str,
        message: str,
        instruction: str,
    ) -> None:
        issues.append(
            ValidationIssue(
                code=code,
                severity=ValidationSeverity.ERROR,
                component=component,
                path=path,
                message=message,
                repair_instruction=instruction,
            )
        )

    def warning(
        code: str,
        component: RepairComponent,
        path: str,
        message: str,
        instruction: str,
    ) -> None:
        issues.append(
            ValidationIssue(
                code=code,
                severity=ValidationSeverity.WARNING,
                component=component,
                path=path,
                message=message,
                repair_instruction=instruction,
            )
        )

    scenes = bundle.storyline.scenes
    scene_ids = [scene.scene_id for scene in scenes]
    scene_id_set = set(scene_ids)
    premise_text = " ".join(
        [
            bundle.storyline.synopsis,
            bundle.storyline.intro.role,
            *bundle.storyline.intro.text,
        ]
    ).lower()
    learning_references = [
        scene.learning_reference
        for scene in scenes
        if scene.learning_reference is not None
    ]
    if not 2 <= len(learning_references) <= 3:
        error(
            "LEARNING_REFERENCE_COUNT",
            RepairComponent.STORYLINE,
            "storyline.scenes[*].learning_reference",
            "Stories must include two or three attributed visual learning references.",
            (
                "Use two or three supplied reference images on explanatory scenes."
            ),
        )
    if len({str(item.image_url) for item in learning_references}) != len(
        learning_references
    ):
        error(
            "DUPLICATE_LEARNING_REFERENCE",
            RepairComponent.STORYLINE,
            "storyline.scenes[*].learning_reference.image_url",
            "Each learning reference must show a different visual.",
            "Use a distinct supplied reference image on each explanatory scene.",
        )
    if re.search(
        r"\b(science club|classroom|school project|student team|science fair|"
        r"training exercise|club member|participant|assistant|trainee|student)\b",
        premise_text,
    ):
        error(
            "NON_PROFESSIONAL_PREMISE",
            RepairComponent.STORYLINE,
            "storyline.intro",
            "The learner must lead a believable real-world professional situation.",
            (
                "Replace school, club, training, participant, and assistant framing "
                "with a primary professional role that has authority to act."
            ),
        )
    if len(scene_ids) != len(scene_id_set):
        error(
            "DUPLICATE_SCENE_ID",
            RepairComponent.STORYLINE,
            "storyline.scenes",
            "Scene identifiers must be unique.",
            "Rename duplicate scenes and update every reference.",
        )
    if bundle.storyline.opening_scene_id not in scene_id_set:
        error(
            "MISSING_OPENING_SCENE",
            RepairComponent.STORYLINE,
            "storyline.opening_scene_id",
            "The opening scene does not exist.",
            "Point opening_scene_id at an existing first scene.",
        )

    next_by_scene = {scene.scene_id: scene.next_scene_id for scene in scenes}
    for scene in scenes:
        if scene.next_scene_id and scene.next_scene_id not in scene_id_set:
            error(
                "BROKEN_SCENE_REFERENCE",
                RepairComponent.STORYLINE,
                f"storyline.scenes[{scene.scene_id}].next_scene_id",
                f"Scene {scene.scene_id} points to a missing scene.",
                "Use an existing scene ID or terminate the scene with null.",
            )
        if scene.choices and not any(choice.correct for choice in scene.choices):
            error(
                "NO_CORRECT_CHOICE",
                RepairComponent.STORYLINE,
                f"storyline.scenes[{scene.scene_id}].choices",
                "A choice scene has no correct route.",
                "Mark at least one pedagogically defensible choice as correct.",
            )
        long_sentences = [
            sentence.strip()
            for paragraph in scene.narrative
            for sentence in re.split(r"(?<=[.!?])\s+", paragraph)
            if len(re.findall(r"\b[\w'-]+\b", sentence)) > 22
        ]
        if long_sentences:
            error(
                "NARRATIVE_TOO_COMPLEX",
                RepairComponent.STORYLINE,
                f"storyline.scenes[{scene.scene_id}].narrative",
                "A learner-facing sentence exceeds the 22-word readability limit.",
                "Split dense sentences and explain only one idea at a time.",
            )

    interaction_counts = {
        kind: sum(scene.interaction_slot is kind for scene in scenes)
        for kind in ActivityKind
    }
    decision_count = sum(
        count
        for kind, count in interaction_counts.items()
        if kind is not ActivityKind.REFLECTION
    )
    if decision_count < 2:
        error(
            "INSUFFICIENT_DECISIONS",
            RepairComponent.ACTIVITIES,
            "storyline.scenes",
            "The story must ask the learner to make at least two decisions.",
            "Add consequential quiz, reorder, slider, or simulation interactions.",
        )

    primer_scenes = [scene for scene in scenes if scene.primer]
    primer_acts = {scene.act for scene in primer_scenes}
    if sum(len(scene.primer) for scene in scenes) < 3 or len(primer_acts) < 2:
        error(
            "INSUFFICIENT_PRIMERS",
            RepairComponent.STORYLINE,
            "storyline.scenes",
            "The story needs at least three primers distributed across two acts.",
            "Add concise in-world primers to at least three scenes across two acts.",
        )
    trivia_scenes = [scene for scene in scenes if scene.trivia]
    trivia_acts = {scene.act for scene in trivia_scenes}
    if len(trivia_scenes) < 3 or len(trivia_acts) < 2:
        error(
            "INSUFFICIENT_TRIVIA",
            RepairComponent.STORYLINE,
            "storyline.scenes",
            "The story needs at least three trivia cards distributed across two acts.",
            "Add evidence-relevant trivia to at least three scenes across two acts.",
        )

    for scene in scenes:
        learning_block_count = (
            bool(scene.primer)
            + (scene.learning_reference is not None)
            + (scene.trivia is not None)
        )
        if learning_block_count > 2:
            error(
                "TOO_MANY_LEARNING_BLOCKS",
                RepairComponent.STORYLINE,
                f"storyline.scenes[{scene.scene_id}]",
                "A scene may show at most two supplemental learning blocks.",
                "Keep the primer first and move the trivia or reference to the next scene.",
            )

    ending_count = sum(scene.scene_type == "ending" for scene in scenes)
    if ending_count != 1:
        error(
            "INVALID_ENDING_COUNT",
            RepairComponent.STORYLINE,
            "storyline.scenes",
            "The authored player requires exactly one ending scene.",
            "Keep exactly one terminal scene with scene_type set to ending.",
        )
    for scene in scenes:
        if scene.interaction_slot is not None and (
            scene.hints is None or scene.concept is None
        ):
            error(
                "INCOMPLETE_INTERACTION_GUIDANCE",
                RepairComponent.STORYLINE,
                f"storyline.scenes[{scene.scene_id}]",
                "Every interaction scene needs three hints and a named concept.",
                "Add progressively revealing hints and a concise concept label.",
            )

    if scenes and all(scene.next_scene_id is not None for scene in scenes):
        error(
            "NO_TERMINAL_SCENE",
            RepairComponent.STORYLINE,
            "storyline.scenes",
            "The story graph has no terminal scene.",
            "End at least one resolved scene with next_scene_id set to null.",
        )

    reachable: set[str] = set()
    current = bundle.storyline.opening_scene_id
    while current in scene_id_set and current not in reachable:
        reachable.add(current)
        current = next_by_scene[current] or ""
    unreachable = scene_id_set - reachable
    if unreachable:
        error(
            "UNREACHABLE_SCENES",
            RepairComponent.STORYLINE,
            "storyline.scenes",
            f"Unreachable scenes: {', '.join(sorted(unreachable))}.",
            "Reconnect or remove every unreachable scene.",
        )

    approved_sources = {
        str(source.url): source
        for source in bundle.selected_topic.candidate.source_evidence
    }
    for index, citation in enumerate(bundle.storyline.citations):
        approved = approved_sources.get(str(citation.url))
        if approved is None or citation != approved:
            error(
                "UNAPPROVED_CITATION_EVIDENCE",
                RepairComponent.STORYLINE,
                f"storyline.citations[{index}]",
                "The storyline citation does not exactly match canonical Exa evidence.",
                "Copy the complete source evidence attached to the selected topic.",
            )

    expected_activities = {
        scene.scene_id: scene.interaction_slot
        for scene in scenes
        if scene.interaction_slot is not None
    }
    actual_activities = {
        activity.scene_id: activity.kind
        for activity in bundle.activities.activities
    }
    if expected_activities != actual_activities:
        error(
            "ACTIVITY_SLOT_MISMATCH",
            RepairComponent.ACTIVITIES,
            "activities.activities",
            "Activities do not exactly match storyline interaction slots.",
            "Create one matching activity per interaction slot and no extras.",
        )

    for activity in bundle.activities.activities:
        if activity.kind is ActivityKind.QUIZ and activity.quiz:
            if len(activity.quiz.options) != 4:
                error(
                    "QUIZ_OPTION_COUNT",
                    RepairComponent.ACTIVITIES,
                    f"activities[{activity.activity_id}].quiz.options",
                    "Every quiz must present exactly four thoughtful options.",
                    "Provide four plausible professional strategies with one correct option.",
                )
            option_ids = {item.option_id for item in activity.quiz.options}
            if not set(activity.quiz.correct_option_ids) <= option_ids:
                error(
                    "INVALID_QUIZ_SOLUTION",
                    RepairComponent.ACTIVITIES,
                    f"activities[{activity.activity_id}].quiz",
                    "Quiz solution references an unknown option.",
                    "Make correct_option_ids a subset of option IDs.",
                )
        if activity.kind is ActivityKind.REORDER and activity.reorder:
            item_ids = [item.item_id for item in activity.reorder.items]
            if sorted(item_ids) != sorted(activity.reorder.correct_order):
                error(
                    "INVALID_REORDER_SOLUTION",
                    RepairComponent.ACTIVITIES,
                    f"activities[{activity.activity_id}].reorder",
                    "Reorder solution is not an exact item permutation.",
                    "Include every item ID exactly once in correct_order.",
                )
        if activity.kind is ActivityKind.SLIDER and activity.slider:
            slider = activity.slider
            if slider.readout_expr == "linear" and not {
                "intercept",
                "slope",
            } <= set(slider.readout_params):
                warning(
                    "INVALID_LINEAR_SLIDER",
                    RepairComponent.ACTIVITIES,
                    f"activities[{activity.activity_id}].slider.readout_params",
                    "A linear slider is missing its executable intercept or slope.",
                    (
                        "Prefer explicit finite intercept and slope values; the "
                        "trusted renderer will use its safe linear defaults meanwhile."
                    ),
                )
            if (
                slider.driver_expr == "part_of_total_percent"
                and "numerator" not in slider.driver_params
            ):
                error(
                    "INVALID_DYNAMIC_SLIDER_DRIVER",
                    RepairComponent.ACTIVITIES,
                    f"activities[{activity.activity_id}].slider.driver_params",
                    "The live percentage comparison is missing its numerator.",
                    "Provide the fixed starting part as driver_params.numerator.",
                )
        if activity.kind is ActivityKind.SIMULATION and activity.simulation:
            simulation = activity.simulation
            path = f"activities[{activity.activity_id}].simulation"
            if len(simulation.controls) < 2:
                error(
                    "TRIVIAL_SIMULATION_CONTROLS",
                    RepairComponent.ACTIVITIES,
                    f"{path}.controls",
                    "The simulation is only a disguised target slider.",
                    (
                        "Use at least two independent story-world controls so the "
                        "learner can discover a causal relationship or tradeoff."
                    ),
                )
            clauses = _parse_condition(simulation.success_condition)
            control_by_id = {
                control.control_id: control for control in simulation.controls
            }
            if clauses is None:
                error(
                    "UNAUDITABLE_SIMULATION_CONDITION",
                    RepairComponent.ACTIVITIES,
                    f"{path}.success_condition",
                    "Simulation success must use auditable control-to-number comparisons.",
                    (
                        "Use one or more clauses such as input >= 6 joined only "
                        "with &&. Do not use arithmetic, functions, or control-to-control "
                        "comparisons."
                    ),
                )
                witness = None
            else:
                unknown = {
                    control_id
                    for control_id, _, _ in clauses
                    if control_id not in control_by_id
                }
                if unknown:
                    error(
                        "UNKNOWN_SIMULATION_CONTROL",
                        RepairComponent.ACTIVITIES,
                        f"{path}.success_condition",
                        "Success condition references unknown controls.",
                        f"Use only declared control IDs; remove {sorted(unknown)}.",
                    )
                    witness = None
                else:
                    witness = _success_witness(simulation.controls, clauses)
                    if witness is None:
                        error(
                            "UNREACHABLE_SIMULATION_SUCCESS",
                            RepairComponent.ACTIVITIES,
                            f"{path}.success_condition",
                            "No selectable control values can satisfy the success condition.",
                            (
                                "Adjust the condition or control bounds and step so at "
                                "least one reachable setting succeeds."
                            ),
                        )

            readout_ids = [readout.readout_id for readout in simulation.readouts]
            if not readout_ids:
                error(
                    "MISSING_SIMULATION_READOUT",
                    RepairComponent.ACTIVITIES,
                    f"{path}.readouts",
                    "The simulation names outputs but cannot calculate or display them.",
                    (
                        "Add a typed identity, linear, base_conversion, or lookup "
                        "readout for every observed variable."
                    ),
                )
            elif set(readout_ids) != set(simulation.observed_variables):
                error(
                    "SIMULATION_READOUT_MISMATCH",
                    RepairComponent.ACTIVITIES,
                    f"{path}.readouts",
                    "Observed variables and executable readout IDs do not match.",
                    "Provide exactly one readout for every observed variable.",
                )
            if len(readout_ids) != len(set(readout_ids)):
                error(
                    "DUPLICATE_SIMULATION_READOUT",
                    RepairComponent.ACTIVITIES,
                    f"{path}.readouts",
                    "Simulation readout IDs must be unique.",
                    "Keep one executable definition per observed variable.",
                )
            derived_readouts = [
                readout
                for readout in simulation.readouts
                if len(readout.input_ids) >= 2
                and readout.operation
                in {"sum", "difference", "product", "share_percent", "lookup"}
            ]
            if not derived_readouts:
                error(
                    "TRIVIAL_SIMULATION_READOUT",
                    RepairComponent.ACTIVITIES,
                    f"{path}.readouts",
                    "The simulation does not calculate any useful relationship.",
                    (
                        "Add a visible derived result that combines at least two "
                        "controls through a valid operation; do not mirror a target dial."
                    ),
                )
            for readout in simulation.readouts:
                readout_path = f"{path}.readouts[{readout.readout_id}]"
                unknown_inputs = set(readout.input_ids) - set(control_by_id)
                if unknown_inputs:
                    error(
                        "UNKNOWN_READOUT_INPUT",
                        RepairComponent.ACTIVITIES,
                        f"{readout_path}.input_ids",
                        "Readout references controls that do not exist.",
                        f"Remove unknown inputs {sorted(unknown_inputs)}.",
                    )
                    continue
                shape_error = _readout_shape_error(readout)
                if shape_error:
                    error(
                        "INVALID_SIMULATION_READOUT",
                        RepairComponent.ACTIVITIES,
                        readout_path,
                        shape_error,
                        "Use the required inputs, parameters, and lookup cases for the selected operation.",
                    )
                    continue
                invalid_case = next(
                    (
                        (control_id, value)
                        for case in readout.cases
                        for control_id, value in case.when.items()
                        if control_id not in control_by_id
                        or not _is_selectable(control_by_id[control_id], value)
                    ),
                    None,
                )
                if invalid_case:
                    error(
                        "UNREACHABLE_READOUT_CASE",
                        RepairComponent.ACTIVITIES,
                        f"{readout_path}.cases",
                        "A lookup case uses a control value the learner cannot select.",
                        (
                            f"Use an in-range, step-aligned value for "
                            f"{invalid_case[0]} instead of {invalid_case[1]}."
                        ),
                    )
                    continue
                if witness is not None:
                    actual = _evaluate_readout(readout, witness)
                    if actual != readout.success_value:
                        warning(
                            "SIMULATION_PROMISE_MISMATCH",
                            RepairComponent.ACTIVITIES,
                            f"{readout_path}.success_value",
                            (
                                f"The reachable success state displays {actual!r}, "
                                f"not the promised {readout.success_value!r}."
                            ),
                            (
                                "Align the internal witness metadata when this activity "
                                "is next regenerated; open-ended exploration remains usable."
                            ),
                        )

    subject_text = " ".join(
        [
            bundle.storyline.subject.domain,
            bundle.storyline.subject.discipline,
            *bundle.storyline.subject.topic_tags,
        ]
    ).lower()
    if "physics" in subject_text:
        simulation_count = sum(
            activity.kind is ActivityKind.SIMULATION
            for activity in bundle.activities.activities
        )
        if simulation_count < 3:
            error(
                "PHYSICS_SIMULATION_COUNT",
                RepairComponent.STORYLINE,
                "storyline.scenes[*].interaction_slot",
                "A physics story must contain at least three working simulations.",
                "Assign simulation slots to three suitable scenes and provide one valid activity for each.",
            )
            error(
                "PHYSICS_SIMULATION_ACTIVITIES",
                RepairComponent.ACTIVITIES,
                "activities",
                "A physics story must implement at least three working simulations.",
                "Create valid simulation activities for all three repaired simulation slots.",
            )

    if len(bundle.media_plan.images) > request.media_budget.max_images:
        error(
            "IMAGE_BUDGET_EXCEEDED",
            RepairComponent.MEDIA_PLAN,
            "media_plan.images",
            "The image plan exceeds the requested budget.",
            "Remove lower-value image requests until the budget is met.",
        )
    cover_images = [
        image for image in bundle.media_plan.images if image.scene_id is None
    ]
    image_scene_ids = [
        image.scene_id
        for image in bundle.media_plan.images
        if image.scene_id is not None
    ]
    if len(cover_images) > 1:
        error(
            "INVALID_COVER_IMAGE_COUNT",
            RepairComponent.MEDIA_PLAN,
            "media_plan.images",
            "A story can have at most one dedicated cover image.",
            "Keep only one cover image with scene_id null.",
        )
    elif cover_images and (
        not cover_images[0].asset_key.startswith("cover")
        or cover_images[0].aspect_ratio != "16:9"
    ):
        error(
            "INVALID_COVER_IMAGE",
            RepairComponent.MEDIA_PLAN,
            "media_plan.images",
            "The dedicated cover must use a cover asset key and 16:9 aspect ratio.",
            "Use scene_id null, a cover-prefixed asset key, and 16:9 aspect ratio.",
        )
    if (
        not set(image_scene_ids).issubset(scene_id_set)
        or len(image_scene_ids) != len(set(image_scene_ids))
    ):
        error(
            "INVALID_SCENE_IMAGE_LINKS",
            RepairComponent.MEDIA_PLAN,
            "media_plan.images",
            "Generated scene images must link to unique, existing scenes.",
            "Remove duplicate images and images linked to unknown scene IDs.",
        )
    missing_scene_ids = scene_id_set - set(image_scene_ids)
    if len(cover_images) != 1 or len(missing_scene_ids) > MAX_MISSING_SCENE_IMAGES:
        error(
            "INCOMPLETE_STORY_IMAGE_COVERAGE",
            RepairComponent.MEDIA_PLAN,
            "media_plan.images",
            (
                "The cover is missing or more than two story scenes lack generated "
                "images."
            ),
            "Provide one cover and leave at most two story scenes without images.",
        )
    elif missing_scene_ids:
        warning(
            "PARTIAL_STORY_IMAGE_COVERAGE",
            RepairComponent.MEDIA_PLAN,
            "media_plan.images",
            f"Story released without images for scenes {sorted(missing_scene_ids)}.",
            "Backfill these scene images later without regenerating the story.",
        )
    character_names = [
        character.name.lower() for character in bundle.storyline.characters
    ]
    for image in bundle.media_plan.images:
        prompt = image.prompt.lower()
        if not any(name in prompt for name in character_names):
            warning(
                "IMAGE_MISSING_RECURRING_CHARACTER",
                RepairComponent.MEDIA_PLAN,
                f"media_plan.images[{image.asset_key}].prompt",
                "Every image prompt must name a recurring story character.",
                "Prefer a named recurring character when regenerating this image.",
            )
        if "adult" not in prompt:
            error(
                "IMAGE_CHARACTER_AGE_UNSAFE",
                RepairComponent.MEDIA_PLAN,
                f"media_plan.images[{image.asset_key}].prompt",
                "Generated-media characters must be described as fictional adults.",
                "State that every depicted character is a fictional adult age 21 or older.",
            )
        elif re.search(r"\b(teenage|teenager|teen|child|kid|minor)\b", prompt):
            warning(
                "IMAGE_AGE_WORDING_AMBIGUOUS",
                RepairComponent.MEDIA_PLAN,
                f"media_plan.images[{image.asset_key}].prompt",
                (
                    "The prompt explicitly requires adult characters but also uses "
                    "a youth-related word, often inside an exclusion."
                ),
                "Remove the ambiguous youth-related wording when this image is regenerated.",
            )
    proposed_video = bundle.media_plan.video
    if proposed_video and (
        not request.media_budget.video.enabled
        or request.media_budget.video.max_clips < 1
        or proposed_video.duration_seconds
        > request.media_budget.video.max_total_seconds
    ):
        error(
            "VIDEO_BUDGET_EXCEEDED",
            RepairComponent.MEDIA_PLAN,
            "media_plan.video",
            "The proposed video exceeds or ignores the video budget.",
            "Remove the video or reduce it to the permitted duration.",
        )
    approved_video = bundle.video_decision.approved_request
    if approved_video and (
        not request.media_budget.video.enabled
        or request.media_budget.video.max_clips < 1
        or approved_video.duration_seconds
        > request.media_budget.video.max_total_seconds
        or proposed_video is None
        or approved_video.asset_key != proposed_video.asset_key
        or approved_video.scene_id != proposed_video.scene_id
        or approved_video.duration_seconds != proposed_video.duration_seconds
        or approved_video.aspect_ratio != proposed_video.aspect_ratio
    ):
        error(
            "VIDEO_GATE_BUDGET_BYPASS",
            RepairComponent.MEDIA_PLAN,
            "video_decision.approved_request",
            "The approved video bypasses the media plan or job budget.",
            "Reject it or restore the immutable planned fields within budget.",
        )
    if not request.media_budget.generate_background_audio and bundle.media_plan.audio:
        error(
            "AUDIO_BUDGET_EXCEEDED",
            RepairComponent.MEDIA_PLAN,
            "media_plan.audio",
            "Audio was planned when background audio was disabled.",
            "Set media_plan.audio to null.",
        )
    if bundle.media_plan.audio:
        audio_prompt = bundle.media_plan.audio.prompt.lower()
        negative_prompt = bundle.media_plan.audio.negative_prompt.lower()
        has_spatial_mood = "binaural" in audio_prompt and re.search(
            r"\b(mood|tension|urgent|calm|resolve|resolution|atmosphere)\b",
            audio_prompt,
        )
        has_ethereal_direction = re.search(
            r"\b(ethereal|airy|atmospheric|drone|sustained|slowly evolving)\b",
            audio_prompt,
        )
        rejects_beats = all(
            term in negative_prompt
            for term in ("beat", "percussion", "drum", "rhythmic pulse")
        )
        if not (has_spatial_mood and has_ethereal_direction and rejects_beats):
            error(
                "AUDIO_MISSING_ETHEREAL_MOOD",
                RepairComponent.MEDIA_PLAN,
                "media_plan.audio.prompt",
                (
                    "Background audio must be beatless ethereal ambience shaped "
                    "around the story setting and mood."
                ),
                (
                    "Describe slow, mild, sustained atmospheric textures in a "
                    "spacious binaural field, and exclude beats, percussion, drums, "
                    "and rhythmic pulses in negative_prompt."
                ),
            )

    expected_asset_keys = {item.asset_key for item in bundle.media_plan.images}
    if bundle.media_plan.audio:
        expected_asset_keys.add(bundle.media_plan.audio.asset_key)
    if bundle.video_decision.approved_request:
        expected_asset_keys.add(bundle.video_decision.approved_request.asset_key)
    actual_asset_keys = {item.asset_key for item in bundle.assets}
    if expected_asset_keys != actual_asset_keys:
        error(
            "ASSET_SET_MISMATCH",
            RepairComponent.ASSETS,
            "assets",
            "Uploaded assets do not exactly cover the approved media plan.",
            "Regenerate missing assets and remove unreferenced asset metadata.",
        )
    if len(actual_asset_keys) != len(bundle.assets):
        error(
            "DUPLICATE_ASSET_KEY",
            RepairComponent.ASSETS,
            "assets",
            "Uploaded asset keys must be unique.",
            "Keep one uploaded asset for each stable asset key.",
        )

    allowed_types = {
        AssetKind.IMAGE: ALLOWED_IMAGE_MIME_TYPES,
        AssetKind.VIDEO: ALLOWED_VIDEO_MIME_TYPES,
        AssetKind.AUDIO: ALLOWED_AUDIO_MIME_TYPES,
    }
    for index, asset in enumerate(bundle.assets):
        if asset.content_type not in allowed_types[asset.kind]:
            error(
                "INVALID_ASSET_MIME",
                RepairComponent.ASSETS,
                f"assets[{index}].content_type",
                f"{asset.content_type} is not allowed for {asset.kind}.",
                "Regenerate or transcode the asset to an allowed MIME type.",
            )

    embedding_keys = [item.content_key for item in bundle.embeddings]
    if len(embedding_keys) != len(set(embedding_keys)):
        error(
            "DUPLICATE_EMBEDDING_KEY",
            RepairComponent.EMBEDDINGS,
            "embeddings",
            "Embedding content keys must be unique.",
            "Keep exactly one current embedding per content key.",
        )
    return issues


def _parse_condition(
    condition: str,
) -> list[tuple[str, str, float]] | None:
    parts = re.split(r"\s*(?:&&|\band\b)\s*", condition, flags=re.IGNORECASE)
    if not parts:
        return None
    clauses: list[tuple[str, str, float]] = []
    for part in parts:
        match = _CONDITION_CLAUSE.fullmatch(part)
        if match is None:
            return None
        clauses.append((match.group(1), match.group(2), float(match.group(3))))
    return clauses


def _success_witness(
    controls: list[SimulationControl],
    clauses: list[tuple[str, str, float]],
) -> dict[str, float] | None:
    witness: dict[str, float] = {}
    for control in controls:
        relevant = [clause for clause in clauses if clause[0] == control.control_id]
        raw_candidates = [control.minimum, control.initial, control.maximum]
        for _, _, threshold in relevant:
            raw_candidates.extend(
                [threshold - control.step, threshold, threshold + control.step]
            )
        candidates = {
            control.minimum
            + round((candidate - control.minimum) / control.step) * control.step
            for candidate in raw_candidates
        }
        selected = next(
            (
                value
                for value in sorted(candidates)
                if _is_selectable(control, value)
                and all(_compare(value, operator, expected) for _, operator, expected in relevant)
            ),
            None,
        )
        if selected is None:
            return None
        witness[control.control_id] = selected
    return witness


def _is_selectable(control: SimulationControl, value: float) -> bool:
    if value < control.minimum - 1e-9 or value > control.maximum + 1e-9:
        return False
    steps = (value - control.minimum) / control.step
    return abs(steps - round(steps)) < 1e-8


def _compare(actual: float, operator: str, expected: float) -> bool:
    if operator == "==":
        return abs(actual - expected) < 1e-9
    if operator == ">=":
        return actual >= expected
    if operator == "<=":
        return actual <= expected
    if operator == ">":
        return actual > expected
    return actual < expected


def _readout_shape_error(readout: SimulationReadout) -> str | None:
    if len(readout.input_ids) != len(set(readout.input_ids)):
        return "Readout input IDs must be unique."
    if readout.operation in {"identity", "linear", "base_conversion"} and len(
        readout.input_ids
    ) != 1:
        return f"{readout.operation} requires exactly one input."
    if readout.operation == "linear" and not {"intercept", "slope"} <= set(
        readout.params
    ):
        return "Linear readouts require intercept and slope parameters."
    if readout.operation in {"sum", "difference", "product", "share_percent"} and len(
        readout.input_ids
    ) < 2:
        return f"{readout.operation} requires at least two inputs."
    if readout.operation == "base_conversion":
        radix = readout.params.get("radix")
        if radix is None or radix != int(radix) or not 2 <= radix <= 36:
            return "Base conversion requires an integer radix from 2 to 36."
    if readout.operation == "lookup":
        if not readout.cases:
            return "Lookup readouts require at least one case."
        expected_inputs = set(readout.input_ids)
        if any(set(case.when) != expected_inputs for case in readout.cases):
            return "Every lookup case must provide every declared input exactly once."
    elif readout.cases:
        return "Only lookup readouts may contain cases."
    return None


def _evaluate_readout(
    readout: SimulationReadout, values: dict[str, float]
) -> str:
    input_value = values[readout.input_ids[0]]
    if readout.operation == "identity":
        return f"{input_value:.{readout.decimals}f}"
    if readout.operation == "linear":
        result = (
            readout.params["intercept"]
            + readout.params["slope"] * input_value
        )
        return f"{result:.{readout.decimals}f}"
    input_values = [values[input_id] for input_id in readout.input_ids]
    if readout.operation == "sum":
        return f"{sum(input_values):.{readout.decimals}f}"
    if readout.operation == "difference":
        result = input_values[0] - sum(input_values[1:])
        return f"{result:.{readout.decimals}f}"
    if readout.operation == "product":
        result = 1.0
        for value in input_values:
            result *= value
        return f"{result:.{readout.decimals}f}"
    if readout.operation == "share_percent":
        total = sum(input_values)
        if abs(total) < 1e-12:
            return readout.fallback
        return f"{(input_values[0] / total) * 100:.{readout.decimals}f}"
    if readout.operation == "base_conversion":
        return _to_base(int(input_value), int(readout.params["radix"]))
    for case in readout.cases:
        if all(abs(values[key] - expected) < 1e-9 for key, expected in case.when.items()):
            return case.value
    return readout.fallback


def _to_base(value: int, radix: int) -> str:
    if value == 0:
        return "0"
    digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    sign = "-" if value < 0 else ""
    value = abs(value)
    output = ""
    while value:
        value, remainder = divmod(value, radix)
        output = digits[remainder] + output
    return sign + output


def merge_validation_reports(
    semantic: ValidationReport,
    deterministic: list[ValidationIssue],
) -> ValidationReport:
    issues = [*deterministic, *semantic.issues]
    has_errors = any(
        issue.severity is ValidationSeverity.ERROR for issue in issues
    )
    return ValidationReport(
        is_valid=not has_errors,
        quality_score=min(
            semantic.quality_score,
            60 if deterministic else semantic.quality_score,
        ),
        issues=issues,
        factual_grounding_summary=semantic.factual_grounding_summary,
        safety_summary=semantic.safety_summary,
    )


def normalize_simulation_readouts(plan: ActivityPlan) -> ActivityPlan:
    # Do not turn malformed model output into a self-consistent wrong answer.
    # The deterministic release gate must see and reject the original formula.
    return plan


def bounded_release_report(
    report: ValidationReport,
    deterministic: list[ValidationIssue],
) -> ValidationReport:
    critical_terms = (
        "SAFETY",
        "UNSAFE",
        "FACT",
        "CITATION",
        "PRIVACY",
        "AGE_INAPPROPRIATE",
    )
    critical = [
        issue
        for issue in report.issues
        if issue.severity is ValidationSeverity.ERROR
        and any(term in issue.code for term in critical_terms)
    ]
    deterministic_errors = [
        issue
        for issue in deterministic
        if issue.severity is ValidationSeverity.ERROR
    ]
    if deterministic_errors or critical:
        return report
    return report.model_copy(
        update={
            "is_valid": True,
            "issues": [
                issue.model_copy(
                    update={"severity": ValidationSeverity.WARNING}
                )
                for issue in report.issues
            ],
        }
    )


def bundle_for_semantic_validation(bundle: GeneratedStoryBundle) -> dict:
    payload = bundle.model_dump(mode="json")
    for embedding in payload["embeddings"]:
        embedding.pop("vector", None)
    return payload
