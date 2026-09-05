"""Reusable test builders for story-pipeline contracts."""

from __future__ import annotations

from datetime import UTC, datetime

from artham_partner.story_pipeline.config import PipelineSettings
from artham_partner.story_pipeline.contracts import (
    ActivityKind,
    ActivityPlan,
    ActivitySpec,
    AssetKind,
    AssetReference,
    AudioRequest,
    ChoiceDraft,
    Difficulty,
    GeneratedStoryBundle,
    ImageRequest,
    MediaPlan,
    PreSessionOption,
    PreSessionQuestion,
    QuizOption,
    QuizSpec,
    ReflectionSpec,
    ReorderItem,
    ReorderSpec,
    SceneDraft,
    ScenePrimer,
    SceneLearningReference,
    SceneTrivia,
    SelectedTopic,
    SimulationControl,
    SimulationGuide,
    SimulationReadout,
    SimulationSpec,
    SliderBand,
    SliderSpec,
    SourceEvidence,
    StoryCharacter,
    StoryIntro,
    StorylineDraft,
    StoryTakeaway,
    SubjectRef,
    TopicCandidate,
    VideoDecision,
)


def settings() -> PipelineSettings:
    return PipelineSettings(
        google_cloud_project="test-project",
        google_cloud_location="global",
        vertex_media_location="us-central1",
        pipeline_model="test-model",
        fast_model="test-fast-model",
        critic_model="test-critic-model",
        topic_model="test-topic-model",
        session_database_url="sqlite+aiosqlite:////tmp/artham-agent-tests.db",
        image_model="test-image",
        veo_model="test-veo",
        lyria_model="test-lyria",
        embedding_model="test-embedding",
        openai_api_key="test-openai",
        openrouter_api_key="test-openrouter",
        openrouter_base_url="https://openrouter.test/api/v1",
        exa_api_key="test-exa",
        exa_base_url="https://api.exa.test",
        backend_base_url="https://backend.test",
        backend_api_key="test-backend",
        request_timeout_seconds=1,
        media_timeout_seconds=2,
        max_media_concurrency=2,
    )


def bundle() -> GeneratedStoryBundle:
    source = SourceEvidence(
        title="A well-supported source",
        url="https://source.test/article",
        excerpt=(
            "This source contains enough factual context to support the "
            "educational premise."
        ),
    )
    subject = SubjectRef(
        domain="natural sciences",
        discipline="systems science",
        topic_tags=["systems"],
    )
    candidate = TopicCandidate(
        candidate_id="system-under-pressure",
        title="A System Under Pressure",
        subject=subject,
        premise=(
            "A control room must identify why a familiar system behaves "
            "differently under a new constraint."
        ),
        learning_objectives=["Understand how one variable changes a system."],
        why_now="The supplied source describes a recent real-world observation.",
        source_evidence=[source],
        novelty_score=0.8,
        story_potential_score=0.9,
        age_suitability_score=0.95,
    )
    selected = SelectedTopic(
        candidate=candidate,
        engagement_rationale=(
            "The learner completes investigation stories and has not recently "
            "seen this concept."
        ),
        predicted_engagement_score=0.85,
        novelty_balance="A familiar investigation format introduces a new system.",
    )
    references = [
        SceneLearningReference(
            title=f"Open diagram {index}",
            image_url=f"https://upload.wikimedia.org/open-{index}.svg",
            source_page_url=(
                "https://commons.wikimedia.org/wiki/"
                f"File:Open_diagram_{index}.svg"
            ),
            source_name=f"Open author {index}",
            license_name="CC BY-SA 4.0",
            license_url="https://creativecommons.org/licenses/by-sa/4.0/",
            alt_text=f"Open diagram showing system state {index}.",
            plain_explanation=(
                "The diagram shows one input changing while the other parts "
                "of the system stay fixed."
            ),
            why_important=(
                "This matters because the team must identify which single "
                "change caused the signal."
            ),
        )
        for index in range(2)
    ]
    scenes = [
        SceneDraft(
            scene_id="s1",
            act=1,
            title="The alert",
            narrative=["An unfamiliar signal appears on the control board."],
            learning_purpose="Establish the system and ask for an initial model.",
            interaction_slot=ActivityKind.QUIZ,
            choices=[
                ChoiceDraft(
                    choice_id="measure",
                    label="Measure one variable",
                    consequence="The team isolates a useful signal.",
                    correct=True,
                )
            ],
            next_scene_id="s2",
            media_cue="A wide control-room view showing one unusual signal.",
            scene_type="choice",
            mood="alarm",
            beat="The alert",
            hints=["Read the signal first.", "Change only one input.", "Measure one variable."],
            concept="Controlled measurement",
            primer=[
                ScenePrimer(
                    term="Variable",
                    plain="A variable is one part of a system that can change.",
                    like="one dial on a kitchen oven.",
                )
            ],
            learning_reference=references[0],
        ),
        SceneDraft(
            scene_id="s2",
            act=1,
            title="The first test",
            narrative=["The first controlled measurement rules out noise."],
            learning_purpose="Show why changing one variable produces evidence.",
            interaction_slot=ActivityKind.SIMULATION,
            next_scene_id="s3",
            media_cue="A close view of the changed instrument reading.",
            scene_type="narrative",
            mood="insight",
            beat="First test",
            hints=["Move one control.", "Watch the signal.", "Isolate the input."],
            concept="Controlled test",
            learning_reference=references[1],
            trivia=SceneTrivia(
                emoji="🎛️",
                title="Control rooms listen",
                text="Operators compare several signals before changing a system.",
            ),
        ),
        SceneDraft(
            scene_id="s3",
            act=2,
            title="The sequence",
            narrative=["Three events must be placed in causal order."],
            learning_purpose="Require the learner to reconstruct the mechanism.",
            interaction_slot=ActivityKind.REORDER,
            next_scene_id="s4",
            media_cue="Three physical stages of the mechanism side by side.",
            scene_type="reorder",
            mood="insight",
            beat="The chain",
            hints=["Find the first change.", "Follow the signal.", "Constraint, signal, intervention."],
            concept="Causal sequence",
            primer=[
                ScenePrimer(
                    term="Causal",
                    plain="A causal chain shows which event makes the next event happen.",
                    like="dominoes falling one after another.",
                )
            ],
            trivia=SceneTrivia(
                emoji="🔗",
                title="Chains reveal causes",
                text="Ordered evidence can separate a cause from a coincidence.",
            ),
        ),
        SceneDraft(
            scene_id="s4",
            act=2,
            title="The decision",
            narrative=["The reconstructed mechanism points to one intervention."],
            learning_purpose="Apply the causal model to a practical decision.",
            interaction_slot=ActivityKind.SLIDER,
            next_scene_id="s5",
            media_cue="The team applying the selected intervention safely.",
            scene_type="slider",
            mood="tense",
            beat="The decision",
            hints=["Find the safe band.", "Compare input and limit.", "Tune to the target."],
            concept="Safe operating range",
            primer=[
                ScenePrimer(
                    term="Threshold",
                    plain="A threshold is the point where a system changes behavior.",
                    like="water beginning to boil at a particular temperature.",
                )
            ],
        ),
        SceneDraft(
            scene_id="s5",
            act=2,
            title="The stress test",
            narrative=["A changed condition tests whether the intervention will hold."],
            learning_purpose="Test the provisional fix under a changed condition.",
            interaction_slot=ActivityKind.SIMULATION,
            next_scene_id="s6",
            media_cue="The team stress-testing the system under a changed condition.",
            scene_type="narrative",
            mood="alarm",
            beat="The reversal",
            hints=["Change one condition.", "Watch what fails first.", "Test the fix under stress."],
            concept="Robustness",
            primer=[
                ScenePrimer(
                    term="Robustness",
                    plain="Robustness means a system keeps working when conditions change.",
                    like="a backpack that stays useful in light rain.",
                )
            ],
            trivia=SceneTrivia(
                emoji="✅",
                title="One change speaks",
                text="Controlled tests make the effect of one change easier to see.",
            ),
        ),
        SceneDraft(
            scene_id="s6",
            act=3,
            title="Revise the model",
            narrative=["The team pauses to explain why the first fix failed under stress."],
            learning_purpose="Ask the learner to revise the model from new evidence.",
            interaction_slot=ActivityKind.REFLECTION,
            next_scene_id="s7",
            media_cue="The recurring team studying the new evidence together.",
            scene_type="reflect",
            mood="insight",
            beat="Model revision",
            hints=["Name the changed condition.", "Connect it to the failure.", "Revise the mechanism."],
            concept="Model revision",
        ),
        SceneDraft(
            scene_id="s7",
            act=3,
            title="The result",
            narrative=["The revised intervention holds and the system returns to a safe state."],
            learning_purpose="Resolve the plot and transfer the core concept.",
            next_scene_id=None,
            media_cue="A calm final view with the team and system operating normally.",
            scene_type="ending",
            mood="resolve",
            beat="The result",
            outcome="success",
        ),
    ]
    storyline = StorylineDraft(
        story_id="system-under-pressure-story",
        title="The Signal",
        tagline="One changed reading is enough to challenge the whole model.",
        synopsis=(
            "A control-room investigation asks the learner to isolate one "
            "variable, reconstruct a mechanism, and choose a safe response."
        ),
        subject=subject,
        target_age=18,
        difficulty=Difficulty.MEDIUM,
        estimated_minutes=8,
        learning_objectives=candidate.learning_objectives,
        opening_scene_id="s1",
        scenes=scenes,
        takeaway=(
            "Changing one variable at a time reveals which part of a system "
            "actually controls the outcome."
        ),
        citations=[source],
        learning_goal="Use controlled changes to identify what drives a system.",
        stage_label="Control room live",
        partner_greeting="The signal changed. Decide what to measure before the team acts.",
        characters=[
            StoryCharacter(
                name="Maya",
                role="student control lead",
                visual_description=(
                    "An adult woman with a dark braid, orange safety jacket, "
                    "clear goggles, and a handheld meter."
                ),
            ),
            StoryCharacter(
                name="Leo",
                role="student systems partner",
                visual_description=(
                    "An adult man with short curls, blue safety jacket, clear "
                    "goggles, and a small tablet."
                ),
            ),
        ],
        intro=StoryIntro(
            role="night control lead",
            text=["One signal has moved while the rest of the room remains steady."],
            cta="Open the board",
        ),
        pre_session=PreSessionQuestion(
            prompt="A new signal appears. What is your first instinct?",
            options=[
                PreSessionOption(id="p1", label="Measure the changed signal.", approach="measure_first"),
                PreSessionOption(id="p2", label="Act before it worsens.", approach="act_first"),
                PreSessionOption(id="p3", label="Look for a repeating pattern.", approach="seek_pattern"),
                PreSessionOption(id="p4", label="Ask the senior operator.", approach="follow_authority"),
            ],
        ),
        player_takeaway=StoryTakeaway(
            concept="Controlled variables",
            field="Physics",
            in_one_line="Changing one variable at a time reveals which part of a system controls the observed outcome.",
            rule="Isolate one input, observe the response, and revise the model before changing several things together.",
            elsewhere=[
                "Debugging a machine by testing one component at a time.",
                "Changing one ingredient while refining a recipe.",
                "Comparing one training variable in an experiment.",
            ],
            you_used_it=[
                "You isolated the unusual signal before acting.",
                "You reconstructed the causal sequence from evidence.",
                "You chose an intervention supported by the controlled test.",
            ],
        ),
    )
    activities = ActivityPlan(
        activities=[
            ActivitySpec(
                activity_id="a1",
                scene_id="s1",
                kind=ActivityKind.QUIZ,
                learning_objective=candidate.learning_objectives[0],
                quiz=QuizSpec(
                    prompt="What produces the clearest first test?",
                    options=[
                        QuizOption(option_id="one", label="Change one variable"),
                        QuizOption(option_id="all", label="Change every variable"),
                        QuizOption(option_id="none", label="Ignore the reading"),
                        QuizOption(option_id="wait", label="Wait for another reading"),
                    ],
                    correct_option_ids=["one"],
                    explanation="One controlled change isolates its effect.",
                ),
            ),
            ActivitySpec(
                activity_id="a2",
                scene_id="s2",
                kind=ActivityKind.SIMULATION,
                learning_objective=candidate.learning_objectives[0],
                simulation=SimulationSpec(
                    prompt="Change one input and watch the signal.",
                    model_kind="signal-response",
                    controls=[
                        SimulationControl(
                            control_id="input",
                            label="Input",
                            description="Changes the strength of the incoming signal.",
                            minimum=0,
                            maximum=10,
                            step=1,
                            initial=2,
                        ),
                        SimulationControl(
                            control_id="gain",
                            label="Amplifier gain",
                            description="Changes how strongly the signal is amplified.",
                            minimum=1,
                            maximum=3,
                            step=1,
                            initial=1,
                        ),
                    ],
                    observed_variables=["signal"],
                    readouts=[
                        SimulationReadout(
                            readout_id="signal",
                            label="Signal",
                            operation="product",
                            input_ids=["input", "gain"],
                            params={},
                            success_value="12",
                        )
                    ],
                    success_condition="input >= 6 && gain >= 2",
                    explanation="The isolated input reveals the response.",
                    guide=SimulationGuide(
                        shows="The display shows how the signal responds to one controlled input.",
                        move="Move the input control through its range one step at a time.",
                        watch="Watch for the combined signal to reach 12 and change consistently.",
                    ),
                ),
            ),
            ActivitySpec(
                activity_id="a3",
                scene_id="s3",
                kind=ActivityKind.REORDER,
                learning_objective=candidate.learning_objectives[0],
                reorder=ReorderSpec(
                    prompt="Put the observations in causal order.",
                    items=[
                        ReorderItem(item_id="one", label="Constraint changes"),
                        ReorderItem(item_id="two", label="Signal responds"),
                        ReorderItem(item_id="three", label="Team intervenes"),
                    ],
                    correct_order=["one", "two", "three"],
                    explanation="The response follows the changed constraint.",
                    instruction="Put the observed events in causal order.",
                    wrong="That order makes an effect happen before its cause.",
                    right="The constraint changes first, the signal responds, and the team can intervene.",
                ),
            ),
            ActivitySpec(
                activity_id="a4",
                scene_id="s4",
                kind=ActivityKind.SLIDER,
                learning_objective=candidate.learning_objectives[0],
                slider=SliderSpec(
                    prompt="Tune the intervention into the safe range.",
                    label="Intervention",
                    minimum=0,
                    maximum=10,
                    step=1,
                    initial=2,
                    target_minimum=6,
                    target_maximum=8,
                    readout_label="Response",
                    readout_expr="linear",
                    readout_params={"slope": 1, "intercept": 0},
                    readout_decimals=0,
                    driver_label="Safety limit",
                    driver_value=9,
                    risk_mode="ceiling",
                    risk_safe_gap=1,
                    meter="gauge",
                    bands=[
                        SliderBand(max=4, text="Too little to stabilize the system."),
                        SliderBand(max=8, text="The system enters its stable operating range."),
                        SliderBand(max=10, text="The intervention approaches the safety limit."),
                    ],
                    explanation="The middle band stabilizes the signal without crossing the limit.",
                    guide=SimulationGuide(
                        shows=(
                            "The meter compares the intervention response with the "
                            "fixed safety limit."
                        ),
                        move=(
                            "Move the Intervention slider from 0 to 10 and watch "
                            "the response update."
                        ),
                        watch=(
                            "Look for the stable middle band while keeping visible "
                            "headroom below the safety limit."
                        ),
                    ),
                ),
            ),
            ActivitySpec(
                activity_id="a5",
                scene_id="s5",
                kind=ActivityKind.SIMULATION,
                learning_objective=candidate.learning_objectives[0],
                simulation=SimulationSpec(
                    prompt="Stress-test the intervention under the changed condition.",
                    model_kind="robustness-test",
                    controls=[
                        SimulationControl(
                            control_id="stress",
                            label="Stress",
                            description="Changes the load pressing on the system.",
                            minimum=0,
                            maximum=10,
                            step=1,
                            initial=1,
                        ),
                        SimulationControl(
                            control_id="support",
                            label="Support",
                            description="Changes how much support resists the load.",
                            minimum=0,
                            maximum=10,
                            step=1,
                            initial=1,
                        ),
                    ],
                    observed_variables=["stability"],
                    readouts=[
                        SimulationReadout(
                            readout_id="stability",
                            label="Stability",
                            operation="difference",
                            input_ids=["support", "stress"],
                            success_value="0",
                        )
                    ],
                    success_condition="stress >= 7 && support >= 7",
                    explanation="A robust intervention remains stable as stress rises.",
                    guide=SimulationGuide(
                        shows="The display compares system stability against increasing stress.",
                        move="Raise the stress control gradually to test the intervention.",
                        watch="Watch whether the support margin reaches 0 under the stress test.",
                    ),
                ),
            ),
            ActivitySpec(
                activity_id="a6",
                scene_id="s6",
                kind=ActivityKind.REFLECTION,
                learning_objective=candidate.learning_objectives[0],
                reflection=ReflectionSpec(
                    prompt="What changed, and how should the model change with it?",
                    placeholder="The new evidence shows...",
                    evidence_to_notice=["The changed condition", "The failed assumption"],
                ),
            ),
        ]
    )
    images = [
        ImageRequest(
            asset_key="cover-story",
            scene_id=None,
            prompt=(
                "A bold cinematic animated story cover with Maya, an adult woman "
                "in an orange safety jacket, and Leo, an adult man in a blue safety "
                "jacket, facing a mysterious control-room signal. All depicted "
                "characters are fictional adults age 21 or older, with no logos "
                "or readable text."
            ),
            alt_text="Maya and Leo face a mysterious control-room signal.",
            aspect_ratio="16:9",
        ),
        *[
        ImageRequest(
            asset_key=f"scene-{scene.scene_id}",
            scene_id=scene.scene_id,
            prompt=(
                f"A cinematic animated story frame for {scene.title}. Maya, an "
                "adult woman with a dark braid and orange safety jacket, works "
                "beside Leo, an adult man with short curls and a blue safety "
                "jacket, in a fictional modern control room. Their faces and "
                "physical actions are clearly visible, with no logos or readable "
                "text."
            ),
            alt_text=f"Story illustration for {scene.title}.",
        )
        for scene in scenes
        ],
    ]
    audio = AudioRequest(
        asset_key="background-score",
        prompt=(
            "Slow, mild, loopable ethereal ambience with airy sustained textures, "
            "a spacious binaural field, and a restrained mood arc from the story's "
            "tense industrial setting through discovery to calm resolution."
        ),
        negative_prompt=(
            "beats, rhythmic pulse, percussion, drums, sharp transients, vocals"
        ),
    )
    media_plan = MediaPlan(
        images=images,
        audio=audio,
        visual_style_guide=(
            "Grounded editorial realism, restrained colors, consistent modern "
            "industrial environment, and no readable text."
        ),
    )
    return GeneratedStoryBundle(
        generation_job_id="job-123",
        learner_id="learner-123",
        selected_topic=selected,
        storyline=storyline,
        activities=activities,
        media_plan=media_plan,
        video_decision=VideoDecision(
            approved=False,
            reason="The story does not require motion to convey its evidence.",
        ),
        assets=[
            AssetReference(
                asset_id="asset-audio",
                asset_key=audio.asset_key,
                kind=AssetKind.AUDIO,
                url="https://cdn.test/background-score.mp3",
                content_type="audio/mpeg",
                byte_size=100,
                sha256="b" * 64,
                provider_model="test-lyria",
            ),
            *[
            AssetReference(
                asset_id=f"asset-{index}",
                asset_key=image.asset_key,
                kind=AssetKind.IMAGE,
                url=f"https://cdn.test/{image.asset_key}.webp",
                content_type="image/webp",
                byte_size=100,
                sha256="a" * 64,
                scene_id=image.scene_id,
                alt_text=image.alt_text,
                provider_model="test-imagen",
            )
            for index, image in enumerate(images, start=1)
            ],
        ],
        embeddings=[],
        created_at=datetime.now(UTC),
    )
