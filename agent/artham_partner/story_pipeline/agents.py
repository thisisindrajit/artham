"""Google ADK LLM agents for each reasoning stage."""

from __future__ import annotations

from typing import Any

from google.adk.agents import LlmAgent
from google.adk.workflow import RetryConfig
from google.genai import types
from pydantic import BaseModel

from .config import PipelineSettings
from .contracts import (
    ActivityPlan,
    ActivitySpec,
    MediaPlan,
    SelectedTopic,
    StorylineDraft,
    TopicCandidates,
    ValidationReport,
)
from .prompts import (
    ACTIVITY_INSTRUCTION,
    COMMON_INSTRUCTION,
    MEDIA_PLAN_INSTRUCTION,
    REPAIR_INSTRUCTION,
    STORYLINE_INSTRUCTION,
    TOPIC_SCOUT_INSTRUCTION,
    TOPIC_SELECTOR_INSTRUCTION,
    VALIDATOR_INSTRUCTION,
)


def _agent(
    *,
    name: str,
    description: str,
    model: str,
    instruction: str,
    output_schema: type[BaseModel],
    temperature: float,
    max_output_tokens: int,
    timeout_seconds: float = 240,
    thinking_level: types.ThinkingLevel | None = None,
    thinking_budget: int | None = None,
) -> LlmAgent:
    return LlmAgent(
        name=name,
        description=description,
        model=model,
        mode="single_turn",
        include_contents="none",
        instruction=f"{COMMON_INSTRUCTION}\n\n{instruction}",
        output_schema=_generation_schema(output_schema),
        retry_config=RetryConfig(
            max_attempts=2,
            initial_delay=1,
            max_delay=4,
            backoff_factor=2,
            jitter=0.2,
        ),
        timeout=timeout_seconds,
        generate_content_config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            thinking_config=(
                types.ThinkingConfig(
                    thinking_level=thinking_level,
                    thinking_budget=thinking_budget,
                )
                if thinking_level is not None or thinking_budget is not None
                else None
            ),
        ),
    )


def _generation_schema(output_schema: type[BaseModel]) -> dict[str, Any]:
    schema = output_schema.model_json_schema()

    def strip_unsupported_hints(value: Any) -> None:
        if isinstance(value, dict):
            value.pop("minItems", None)
            value.pop("maxItems", None)
            value.pop("exclusiveMinimum", None)
            value.pop("exclusiveMaximum", None)
            enum = value.get("enum")
            if isinstance(enum, list) and any(
                not isinstance(item, str) for item in enum
            ):
                value.pop("enum")
            for child in value.values():
                strip_unsupported_hints(child)
        elif isinstance(value, list):
            for child in value:
                strip_unsupported_hints(child)

    strip_unsupported_hints(schema)
    return schema


def build_reasoning_agents(settings: PipelineSettings) -> dict[str, LlmAgent]:
    return {
        "topic_scout": _agent(
            name="topic_scout",
            description="Turns Exa evidence into diverse educational topics.",
            model=settings.fast_model,
            instruction=TOPIC_SCOUT_INSTRUCTION,
            output_schema=TopicCandidates,
            temperature=0.7,
            max_output_tokens=12000,
        ),
        "topic_selector": _agent(
            name="topic_selector",
            description="Selects a topic using prior story engagement.",
            model=settings.fast_model,
            instruction=TOPIC_SELECTOR_INSTRUCTION,
            output_schema=SelectedTopic,
            temperature=0.3,
            max_output_tokens=8000,
        ),
        "storyline": _agent(
            name="storyline_writer",
            description="Writes a complete grounded interactive storyline.",
            model=settings.pipeline_model,
            instruction=STORYLINE_INSTRUCTION,
            output_schema=StorylineDraft,
            temperature=0.65,
            max_output_tokens=32000,
        ),
        "media_planner": _agent(
            name="media_planner",
            description="Plans coherent Imagen illustrations and Lyria background audio.",
            model=settings.pipeline_model,
            instruction=MEDIA_PLAN_INSTRUCTION,
            output_schema=MediaPlan,
            temperature=0.45,
            max_output_tokens=16000,
        ),
        "activities": _agent(
            name="activity_designer",
            description="Creates schema-only interactive learning activities.",
            model=settings.pipeline_model,
            instruction=ACTIVITY_INSTRUCTION,
            output_schema=ActivityPlan,
            temperature=0.2,
            max_output_tokens=60000,
            timeout_seconds=600,
            thinking_level=types.ThinkingLevel.LOW,
        ),
        "validator": _agent(
            name="story_validator",
            description="Performs the final semantic and pedagogical audit.",
            model=settings.pipeline_model,
            instruction=VALIDATOR_INSTRUCTION,
            output_schema=ValidationReport,
            temperature=0.1,
            max_output_tokens=16000,
        ),
        "repair_storyline": _agent(
            name="storyline_repairer",
            description="Repairs validated defects in the storyline only.",
            model=settings.pipeline_model,
            instruction=(
                f"{REPAIR_INSTRUCTION}\n\nReturn only the complete replacement "
                "storyline. Fix storyline issues, preserve unrelated storyline "
                "content, and do not return activities or media."
            ),
            output_schema=StorylineDraft,
            temperature=0.1,
            max_output_tokens=40000,
            timeout_seconds=600,
            thinking_level=types.ThinkingLevel.LOW,
        ),
        "repair_activity": _agent(
            name="activity_repairer",
            description="Repairs one validated scene activity.",
            model=settings.pipeline_model,
            instruction=(
                f"{REPAIR_INSTRUCTION}\n\nReturn exactly one complete activity for "
                "the supplied scene. Its scene_id and kind must exactly match that "
                "scene's interaction_slot. Repair relevant validation issues, "
                "preserve valid current activity content, and return no wrapper, "
                "storyline, other activities, or media."
            ),
            output_schema=ActivitySpec,
            temperature=0.1,
            max_output_tokens=12000,
            timeout_seconds=600,
            thinking_budget=0,
        ),
    }
