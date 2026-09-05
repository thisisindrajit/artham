from __future__ import annotations

import unittest

from artham_partner.story_pipeline.agents import (
    _contains_dynamic_object,
    _generation_schema,
    build_reasoning_agents,
)
from artham_partner.story_pipeline.contracts import (
    ActivitySpec,
    SceneDraft,
    SelectedTopic,
    StoryBlueprint,
    StorylineDraft,
    TopicCandidates,
    ValidationReport,
)
from artham_partner.story_pipeline.partner_contracts import (
    ObserveOutput,
    PreludeOutput,
    ProfileOutput,
)
from artham_partner.story_pipeline.prompts import (
    ACTIVITY_INSTRUCTION,
    ACTIVITY_CHUNK_INSTRUCTION,
    BLUEPRINT_INSTRUCTION,
    SCENE_CHUNK_INSTRUCTION,
    VALIDATOR_INSTRUCTION,
    REPAIR_INSTRUCTION,
    STORYLINE_INSTRUCTION,
)
from artham_partner.story_pipeline.prompts.common import COMMON_INSTRUCTION
from artham_partner.story_pipeline.prompts.media import MEDIA_PLAN_INSTRUCTION, VIDEO_GATE_INSTRUCTION
from artham_partner.story_pipeline.prompts.partner import (
    PARTNER_POLICY,
    observe_prompt,
    prelude_prompt,
    profile_prompt,
)
from artham_partner.story_pipeline.prompts.story_quality import STORY_QUALITY_BAR
from artham_partner.story_pipeline.prompts.topics import (
    TOPIC_RESOLVER_INSTRUCTION,
    TOPIC_SCOUT_INSTRUCTION,
    TOPIC_SELECTOR_INSTRUCTION,
)
from google.adk.cli.utils.agent_loader import AgentLoader
from tests.helpers import settings


class WorkflowDiscoveryTests(unittest.TestCase):
    def test_every_reasoning_agent_teaches_from_zero_knowledge(self) -> None:
        for name, agent in build_reasoning_agents(settings()).items():
            with self.subTest(agent=name):
                instruction = " ".join(agent.instruction.split())
                self.assertIn("Assume ZERO prior knowledge", instruction)
                self.assertIn("Check each explanation recursively", instruction)
                self.assertIn("Simplification must preserve meaning", instruction)
                self.assertIn("not its direction of travel", instruction)
                self.assertIn("Difficulty changes reasoning", instruction)

    def test_planner_and_workers_share_a_teaching_sequence(self) -> None:
        blueprint = " ".join(BLUEPRINT_INSTRUCTION.split())
        scene = " ".join(SCENE_CHUNK_INSTRUCTION.split())
        activity = " ".join(ACTIVITY_CHUNK_INSTRUCTION.split())
        self.assertIn("plan the teaching sequence explicitly in learning_purpose", blueprint)
        self.assertIn("actual source-supported explanation in required_facts", blueprint)
        self.assertIn("prior_learning_context", scene)
        self.assertIn("not proof of what another worker actually wrote", scene)
        self.assertIn("story_context.difficulty", activity)
        self.assertIn("Feedback may reinforce", activity)
        self.assertNotIn("must introduce a genuinely new term", blueprint)
        self.assertNotIn("reference_subject on at least five", blueprint)

    def test_critic_and_repair_audit_missing_prerequisites(self) -> None:
        self.assertIn("ASSUMED_PRIOR_KNOWLEDGE", VALIDATOR_INSTRUCTION)
        self.assertIn("MISLEADING_SIMPLIFICATION", VALIDATOR_INSTRUCTION)
        self.assertIn("initially empty knowledge", VALIDATOR_INSTRUCTION)
        repair = " ".join(REPAIR_INSTRUCTION.split())
        self.assertIn("its supplied activity must be realigned", repair)
        self.assertNotIn("exactly three simulation activities", repair)
        self.assertIn("Assume no prior knowledge", prelude_prompt({}))

    def test_generation_and_validation_share_relaxed_readability_rules(self) -> None:
        for name, agent in build_reasoning_agents(settings()).items():
            with self.subTest(agent=name):
                instruction = " ".join(agent.instruction.split())
                self.assertNotIn("never exceed 22 words", instruction)
                self.assertNotIn("22-word readability limit", instruction)
        for instruction in (BLUEPRINT_INSTRUCTION, SCENE_CHUNK_INSTRUCTION, VALIDATOR_INSTRUCTION):
            self.assertIn("There is no fixed sentence word limit", instruction)
        critic = " ".join(VALIDATOR_INSTRUCTION.split())
        self.assertIn("NARRATIVE_TOO_COMPLEX is a warning only", critic)
        self.assertIn("Sentence length alone is never sufficient", critic)
        self.assertIn("Ignore legacy word-count-only complaints", REPAIR_INSTRUCTION)

    def test_critic_respects_taxonomy_primers_and_media_controls(self) -> None:
        critic = " ".join(VALIDATOR_INSTRUCTION.split())
        self.assertIn("discipline is the requested parent topic", critic)
        self.assertIn("Check reasoning against request.difficulty", critic)
        self.assertIn("they do not require four new technical terms", critic)
        self.assertIn("a present cover does not require scene images", critic)
        self.assertIn("learning-reference cards are temporarily disabled", critic)
        self.assertIn("learner is the primary professional protagonist", critic)

    def test_prompts_enforce_distinct_reasoning_difficulty_levels(self) -> None:
        shared = " ".join(STORY_QUALITY_BAR.split())
        blueprint = " ".join(BLUEPRINT_INSTRUCTION.split())
        activity = " ".join(ACTIVITY_CHUNK_INSTRUCTION.split())
        validator = " ".join(VALIDATOR_INSTRUCTION.split())
        repair = " ".join(REPAIR_INSTRUCTION.split())

        self.assertNotIn("above mid-complexity", shared)
        for prompt in (shared, blueprint, activity, validator, repair):
            with self.subTest(prompt=prompt[:60]):
                self.assertIn("two or three taught clues", prompt)
                self.assertIn("interacting taught constraints", prompt)
        self.assertIn("at least two demanding moments", blueprint)
        self.assertIn("changed condition", blueprint)
        self.assertIn("DIFFICULTY_TOO_LOW", validator)
        self.assertIn("quality_score at 70 or below", validator)
        self.assertIn("DIFFICULTY_TOO_HIGH", validator)
        self.assertIn("deepen the learner's work rather than adding terminology", repair)

    def test_rich_markdown_is_restricted_to_story_narrative(self) -> None:
        narrative_prompts = {
            "common": COMMON_INSTRUCTION,
            "quality": STORY_QUALITY_BAR,
            "scene": SCENE_CHUNK_INSTRUCTION,
            "storyline": STORYLINE_INSTRUCTION,
            "repair": REPAIR_INSTRUCTION,
            "validator": VALIDATOR_INSTRUCTION,
        }
        for name, prompt in narrative_prompts.items():
            with self.subTest(prompt=name):
                text = " ".join(prompt.split())
                self.assertIn("***“Dialogue.”***", text)
                self.assertIn("bold and italic", text)
                self.assertIn("**bold**", text)
                self.assertIn("raw HTML", text)
                self.assertIn("static text", text)
                self.assertIn("Mermaid", text)
                self.assertIn("click actions", text)
                self.assertIn("emoji", text.lower())
                self.assertIn("indispensable", text.lower())

        for name in ("quality", "scene", "storyline", "repair", "validator"):
            with self.subTest(rich_markdown=name):
                text = narrative_prompts[name].lower()
                for feature in ("blockquote", "lists", "tables", "fenced code"):
                    self.assertIn(feature, text)

        for name, prompt in {
            "activity": ACTIVITY_INSTRUCTION,
            "activity_chunk": ACTIVITY_CHUNK_INSTRUCTION,
            "media": MEDIA_PLAN_INSTRUCTION,
            "partner": PARTNER_POLICY,
        }.items():
            with self.subTest(plain_text=name):
                text = " ".join(prompt.lower().split())
                self.assertIn("plain text", text)
                self.assertIn("markdown", text)
                self.assertIn("emoji", text)

        blueprint = " ".join(BLUEPRINT_INSTRUCTION.lower().split())
        self.assertIn("blueprint field itself is plain text", blueprint)

    def test_every_story_requires_quiz_and_simulation(self) -> None:
        for prompt in (
            BLUEPRINT_INSTRUCTION,
            VALIDATOR_INSTRUCTION,
            REPAIR_INSTRUCTION,
        ):
            text = " ".join(prompt.lower().split())
            with self.subTest(prompt=text[:60]):
                self.assertIn("at least one quiz", text)
                self.assertIn("at least one simulation", text)

    def test_no_prompt_reintroduces_legacy_formatting_restrictions(self) -> None:
        prompts = [
            COMMON_INSTRUCTION, STORY_QUALITY_BAR, BLUEPRINT_INSTRUCTION,
            SCENE_CHUNK_INSTRUCTION, STORYLINE_INSTRUCTION, ACTIVITY_INSTRUCTION,
            ACTIVITY_CHUNK_INSTRUCTION, REPAIR_INSTRUCTION, VALIDATOR_INSTRUCTION,
            MEDIA_PLAN_INSTRUCTION, VIDEO_GATE_INSTRUCTION, PARTNER_POLICY,
            TOPIC_RESOLVER_INSTRUCTION, TOPIC_SCOUT_INSTRUCTION, TOPIC_SELECTOR_INSTRUCTION,
        ]
        for index, prompt in enumerate(prompts):
            with self.subTest(prompt=index):
                text = " ".join(prompt.lower().split())
                for obsolete in (
                    "italic only", "italic-only", "italics only",
                    "never bold dialogue", "never bold a line of dialogue",
                    "1-3 essential keywords", "at most one diagram per scene",
                    "at most one per scene", "never emit javascript, python",
                ):
                    self.assertNotIn(obsolete, text)

    def test_learning_reference_generation_is_disabled(self) -> None:
        for prompt in (
            BLUEPRINT_INSTRUCTION,
            SCENE_CHUNK_INSTRUCTION,
            STORYLINE_INSTRUCTION,
            REPAIR_INSTRUCTION,
            VALIDATOR_INSTRUCTION,
        ):
            text = " ".join(prompt.split()).lower()
            with self.subTest(prompt=text[:60]):
                self.assertIn("temporarily disabled", text)
                self.assertIn("reference_subject=null", text)

        for prompt in (
            SCENE_CHUNK_INSTRUCTION,
            STORYLINE_INSTRUCTION,
            REPAIR_INSTRUCTION,
            VALIDATOR_INSTRUCTION,
        ):
            text = " ".join(prompt.split()).lower()
            with self.subTest(fields=text[:60]):
                self.assertIn("reference_fact", text)
                self.assertIn("reference_fact_citation_refs", text)

        for prompt in (STORY_QUALITY_BAR, MEDIA_PLAN_INSTRUCTION):
            self.assertNotIn("reference_fact", prompt)

    def test_endings_are_happy_earned_and_safe_without_lectures(self) -> None:
        for prompt in (
            COMMON_INSTRUCTION, STORY_QUALITY_BAR, BLUEPRINT_INSTRUCTION,
            SCENE_CHUNK_INSTRUCTION, STORYLINE_INSTRUCTION, REPAIR_INSTRUCTION,
            VALIDATOR_INSTRUCTION, MEDIA_PLAN_INSTRUCTION,
        ):
            text = " ".join(prompt.split())
            with self.subTest(prompt=text[:60]):
                self.assertIn("happy", text.lower())
                self.assertRegex(text.lower(), r"\bearn(?:ed)?\b")
                self.assertIn("warm character callback", text)
                self.assertIn("cure", text)
        self.assertIn("not repeated lectures", COMMON_INSTRUCTION)
        self.assertIn("unnecessary technical tangents", STORYLINE_INSTRUCTION)
        self.assertIn("generation prompts remain the source of truth", REPAIR_INSTRUCTION)
        self.assertIn("Ignore legacy complaints", REPAIR_INSTRUCTION)
        self.assertIn("A static code example is not executable behavior", VALIDATOR_INSTRUCTION)

    def test_story_prompts_require_relevant_emojis_without_clutter(self) -> None:
        for prompt in (
            COMMON_INSTRUCTION,
            STORY_QUALITY_BAR,
            SCENE_CHUNK_INSTRUCTION,
            STORYLINE_INSTRUCTION,
            REPAIR_INSTRUCTION,
            VALIDATOR_INSTRUCTION,
        ):
            text = " ".join(prompt.lower().split())
            with self.subTest(prompt=text[:60]):
                self.assertIn("relevant", text)
                self.assertIn("emoji", text)
                self.assertTrue(
                    "random decoration" in text
                    or "reinforce" in text
                )

    def test_partner_tasks_inherit_presentation_without_changing_evidence(self) -> None:
        for factory in (prelude_prompt, observe_prompt, profile_prompt):
            with self.subTest(task=factory.__name__):
                prompt = factory({"choice": "keep **source** wording"})
                normalized = " ".join(prompt.lower().split())
                self.assertIn("Partner copy is plain text", prompt)
                self.assertIn("Do not use Markdown syntax", prompt)
                self.assertIn("never decorate internal evidence quotes", normalized)
                self.assertIn('"choice":"keep **source** wording"', prompt)

    def test_adk_discovers_story_pipeline(self) -> None:
        loader = AgentLoader("artham_partner/story_pipeline")
        loaded = loader.load_agent("story_pipeline")
        self.assertEqual(loaded.name, "story_generation_pipeline")
        self.assertEqual(len(loaded.graph.nodes), 2)
        supervisor = next(
            node
            for node in loaded.graph.nodes
            if node.name == "story_generation_supervisor"
        )
        self.assertTrue(supervisor.rerun_on_resume)

    def test_generation_schema_defers_array_cardinality_validation(self) -> None:
        schema = _generation_schema(TopicCandidates)
        serialized = str(schema)
        self.assertNotIn("minItems", serialized)
        self.assertNotIn("maxItems", serialized)
        self.assertIn("candidates", schema["properties"])

    def test_generation_schema_defers_numeric_literal_validation(self) -> None:
        schema = _generation_schema(StoryBlueprint)
        act_schema = schema["$defs"]["SceneSpec"]["properties"]["act"]
        self.assertEqual(act_schema["type"], "integer")
        self.assertNotIn("enum", act_schema)

    def test_generation_schema_defers_exclusive_numeric_bounds(self) -> None:
        schema = _generation_schema(ActivitySpec)
        step_schema = schema["$defs"]["SimulationControl"]["properties"]["step"]
        self.assertNotIn("exclusiveMinimum", step_schema)

    def test_all_reasoning_schemas_match_openai_strict_subset(self) -> None:
        models = [
            ActivitySpec,
            SceneDraft,
            SelectedTopic,
            StoryBlueprint,
            TopicCandidates,
            ValidationReport,
            ObserveOutput,
            PreludeOutput,
            ProfileOutput,
        ]
        unsupported = {
            "default",
            "exclusiveMaximum",
            "exclusiveMinimum",
            "format",
            "maxItems",
            "maxLength",
            "maxProperties",
            "maximum",
            "minItems",
            "minLength",
            "minimum",
            "multipleOf",
            "pattern",
            "uniqueItems",
        }

        def assert_compatible(value) -> None:
            if isinstance(value, dict):
                self.assertTrue(unsupported.isdisjoint(value))
                properties = value.get("properties")
                if isinstance(properties, dict):
                    self.assertEqual(
                        set(value["required"]),
                        set(properties),
                    )
                    self.assertIs(value["additionalProperties"], False)
                    for child in properties.values():
                        assert_compatible(child)
                definitions = value.get("$defs")
                if isinstance(definitions, dict):
                    for child in definitions.values():
                        assert_compatible(child)
                for key, child in value.items():
                    if key in {"$defs", "properties"}:
                        continue
                    assert_compatible(child)
            elif isinstance(value, list):
                for child in value:
                    assert_compatible(child)

        for model in models:
            with self.subTest(model=model.__name__):
                assert_compatible(_generation_schema(model))

    def test_all_reasoning_agents_use_provider_enforced_schemas(self) -> None:
        agents = build_reasoning_agents(settings())
        output_models = {
            "topic_resolver": SelectedTopic,
            "architect": StoryBlueprint,
            "scene_worker": SceneDraft,
            "activity_worker": ActivitySpec,
            "critic": ValidationReport,
            "repair_storyline": StorylineDraft,
            "repair_activity": ActivitySpec,
        }

        for name, output_model in output_models.items():
            with self.subTest(agent=name):
                self.assertEqual(
                    agents[name].output_schema,
                    _generation_schema(output_model),
                )
                self.assertEqual(
                    agents[name].model._additional_args["reasoning_effort"],
                    "low",
                )
                self.assertEqual(
                    agents[name].model._additional_args["allowed_openai_params"],
                    ["reasoning_effort"],
                )
        self.assertTrue(
            _contains_dynamic_object(_generation_schema(ActivitySpec))
        )
        self.assertFalse(
            _contains_dynamic_object(_generation_schema(StoryBlueprint))
        )

    def test_reasoning_roles_and_models_are_explicit(self) -> None:
        configured = settings()
        agents = build_reasoning_agents(configured)

        self.assertEqual(
            set(agents),
            {
                "topic_resolver",
                "architect",
                "scene_worker",
                "activity_worker",
                "critic",
                "repair_storyline",
                "repair_activity",
            },
        )
        self.assertEqual(agents["architect"].model.model, configured.pipeline_model)
        self.assertEqual(agents["critic"].model.model, configured.critic_model)
        self.assertEqual(
            agents["repair_storyline"].model.model,
            configured.pipeline_model,
        )
        self.assertEqual(agents["repair_storyline"].timeout, 480)
        self.assertEqual(
            agents["repair_activity"].model.model,
            configured.fast_model,
        )
        self.assertEqual(agents["scene_worker"].model.model, configured.fast_model)
        self.assertEqual(agents["topic_resolver"].model.model, configured.topic_model)
        self.assertEqual(
            agents["topic_resolver"].generate_content_config.max_output_tokens,
            3000,
        )
        self.assertEqual(
            agents["architect"].generate_content_config.max_output_tokens,
            9000,
        )
        self.assertEqual(
            agents["scene_worker"].generate_content_config.max_output_tokens,
            4500,
        )
        self.assertEqual(
            agents["activity_worker"].generate_content_config.max_output_tokens,
            5000,
        )
        self.assertEqual(
            agents["critic"].generate_content_config.max_output_tokens,
            7000,
        )
        self.assertEqual(
            agents["repair_storyline"].generate_content_config.max_output_tokens,
            14000,
        )
        self.assertEqual(
            agents["repair_activity"].generate_content_config.max_output_tokens,
            5000,
        )

    def test_prompts_enforce_high_agency_story_quality(self) -> None:
        blueprint = " ".join(BLUEPRINT_INSTRUCTION.split())
        scene = " ".join(SCENE_CHUNK_INSTRUCTION.split())
        activities = " ".join(ACTIVITY_CHUNK_INSTRUCTION.split())
        validator = " ".join(VALIDATOR_INSTRUCTION.split())

        self.assertIn("physical stakes", blueprint)
        self.assertIn("causal progression", blueprint)
        self.assertIn("Do not default to rain", blueprint)
        self.assertIn("culturally varied", blueprint)
        self.assertIn("addressing the learner as \"you\"", blueprint)
        self.assertIn("interesting enough to repeat to a friend", blueprint)
        self.assertIn("concrete action", scene)
        self.assertIn("addressing the learner as \"you\"", scene)
        self.assertIn("visible consequences", scene)
        self.assertIn("format each spoken line", scene)
        self.assertIn("one central idea", scene)
        self.assertIn("reflection is never scored", activities)
        self.assertIn("using their own words", activities)
        self.assertIn("declarative readouts", activities)
        self.assertIn("every control must include a brief", activities)
        self.assertIn("computed success output exactly equals", validator)
        self.assertIn("uses second-person narration", validator)
        self.assertIn(
            "diagnosis, intervention, changed-condition reversal",
            validator,
        )
        self.assertIn("require at least one simulation", validator)


if __name__ == "__main__":
    unittest.main()
