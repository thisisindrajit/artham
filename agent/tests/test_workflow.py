from __future__ import annotations

import unittest

from artham_partner.story_pipeline.agents import _generation_schema
from artham_partner.story_pipeline.contracts import (
    ActivityPlan,
    StorylineDraft,
    TopicCandidates,
)
from artham_partner.story_pipeline.prompts import (
    ACTIVITY_INSTRUCTION,
    MEDIA_PLAN_INSTRUCTION,
    STORYLINE_INSTRUCTION,
    VALIDATOR_INSTRUCTION,
)
from google.adk.cli.utils.agent_loader import AgentLoader


class WorkflowDiscoveryTests(unittest.TestCase):
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
        schema = _generation_schema(StorylineDraft)
        act_schema = schema["$defs"]["SceneDraft"]["properties"]["act"]
        self.assertEqual(act_schema["type"], "integer")
        self.assertNotIn("enum", act_schema)

    def test_generation_schema_defers_exclusive_numeric_bounds(self) -> None:
        schema = _generation_schema(ActivityPlan)
        step_schema = schema["$defs"]["SimulationControl"]["properties"]["step"]
        self.assertNotIn("exclusiveMinimum", step_schema)

    def test_prompts_enforce_high_agency_story_quality(self) -> None:
        storyline = " ".join(STORYLINE_INSTRUCTION.split())
        activities = " ".join(ACTIVITY_INSTRUCTION.split())
        media = " ".join(MEDIA_PLAN_INSTRUCTION.split())
        validator = " ".join(VALIDATOR_INSTRUCTION.split())

        self.assertIn("diagnose the system, intervene", storyline)
        self.assertIn("changed condition", storyline)
        self.assertIn("durable fix", storyline)
        self.assertIn("primary real-world professional", storyline)
        self.assertIn("For thermodynamics stories", storyline)
        self.assertIn("story-world levers", activities)
        self.assertIn("every slider includes guide.shows", activities)
        self.assertIn("Vary the", activities)
        self.assertIn("source position", activities)
        self.assertIn("every observed variable has exactly one", activities)
        self.assertIn("computed success output exactly equals", validator)
        self.assertIn("camera position and shot scale", media)
        self.assertIn("not a generic educational illustration", media)
        self.assertIn("exactly one image request for every storyline scene", media)
        self.assertIn("one dedicated cover image", media)
        self.assertIn("still-image and background-audio media plan", media)
        self.assertIn("Set video=null", media)
        self.assertIn("slowly evolving pads", media)
        self.assertIn("Never make it a movie poster", media)
        self.assertIn("animated cinematic story-frame aesthetic", media)
        self.assertIn(
            "diagnosis, intervention, changed-condition reversal",
            validator,
        )
        self.assertIn("three simulations for physics stories", validator)


if __name__ == "__main__":
    unittest.main()
