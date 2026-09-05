"""Google ADK LLM agents for each reasoning stage."""

from __future__ import annotations

from typing import Any

from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from google.adk.workflow import RetryConfig
from google.genai import types
from pydantic import BaseModel

from .config import PipelineSettings
from .contracts import (
    ActivitySpec,
    SceneDraft,
    SelectedTopic,
    StoryBlueprint,
    StorylineDraft,
    ValidationReport,
)
from .prompts import (
    ACTIVITY_CHUNK_INSTRUCTION,
    BLUEPRINT_INSTRUCTION,
    COMMON_INSTRUCTION,
    SCENE_CHUNK_INSTRUCTION,
    TOPIC_RESOLVER_INSTRUCTION,
    VALIDATOR_INSTRUCTION,
    REPAIR_INSTRUCTION,
)
from .structured_schema import openai_compatible_schema


def _agent(
    *,
    name: str,
    description: str,
    model: str,
    instruction: str,
    output_schema: type[BaseModel],
    max_output_tokens: int,
    timeout_seconds: float = 240,
) -> LlmAgent:
    schema = _generation_schema(output_schema)
    return LlmAgent(
        name=name,
        description=description,
        model=LiteLlm(
            model=model,
            reasoning_effort="low",
            allowed_openai_params=["reasoning_effort"],
        ),
        mode="single_turn",
        include_contents="none",
        instruction=(
            f"{COMMON_INSTRUCTION}\n\n{instruction}\n\n"
            "Return only the structured response required by the output schema."
        ),
        output_schema=schema,
        retry_config=RetryConfig(
            max_attempts=1,
            initial_delay=1,
            max_delay=4,
            backoff_factor=2,
            jitter=0.2,
        ),
        timeout=timeout_seconds,
        generate_content_config=types.GenerateContentConfig(
            max_output_tokens=max_output_tokens,
        ),
    )


def _generation_schema(output_schema: type[BaseModel]) -> dict[str, Any]:
    return openai_compatible_schema(output_schema)


def _contains_dynamic_object(value: Any) -> bool:
    if isinstance(value, dict):
        if isinstance(value.get("additionalProperties"), dict):
            return True
        return any(_contains_dynamic_object(child) for child in value.values())
    if isinstance(value, list):
        return any(_contains_dynamic_object(child) for child in value)
    return False


def build_reasoning_agents(settings: PipelineSettings) -> dict[str, LlmAgent]:
    return {
        "topic_resolver": _agent(
            name="topic_resolver",
            description="Resolves one topic using Exa evidence and engagement.",
            model=settings.topic_model,
            instruction=TOPIC_RESOLVER_INSTRUCTION,
            output_schema=SelectedTopic,
            max_output_tokens=3000,
        ),
        "architect": _agent(
            name="story_architect",
            description="Designs a compact whole-story continuity blueprint.",
            model=settings.pipeline_model,
            instruction=BLUEPRINT_INSTRUCTION,
            output_schema=StoryBlueprint,
            max_output_tokens=9000,
        ),
        "scene_worker": _agent(
            name="scene_chunk_worker",
            description="Expands exactly one blueprint scene.",
            model=settings.fast_model,
            instruction=SCENE_CHUNK_INSTRUCTION,
            output_schema=SceneDraft,
            max_output_tokens=4500,
        ),
        "activity_worker": _agent(
            name="activity_chunk_worker",
            description="Creates exactly one activity for one retained scene.",
            model=settings.fast_model,
            instruction=ACTIVITY_CHUNK_INSTRUCTION,
            output_schema=ActivitySpec,
            max_output_tokens=5000,
        ),
        "critic": _agent(
            name="story_validator",
            description="Returns compact component-addressed release findings.",
            model=settings.critic_model,
            instruction=VALIDATOR_INSTRUCTION,
            output_schema=ValidationReport,
            max_output_tokens=7000,
        ),
        "repair_storyline": _agent(
            name="storyline_repairer",
            description="Repairs only the storyline using the learner critic's feedback.",
            model=settings.pipeline_model,
            instruction=(
                f"{REPAIR_INSTRUCTION}\n\nReturn only the complete replacement "
                "storyline. Do not return activities, media, or a wrapper object."
            ),
            output_schema=StorylineDraft,
            max_output_tokens=14000,
            timeout_seconds=480,
        ),
        "repair_activity": _agent(
            name="activity_repairer",
            description="Repairs one activity using the learner critic's feedback.",
            model=settings.fast_model,
            instruction=(
                f"{REPAIR_INSTRUCTION}\n\nReturn exactly one complete activity for "
                "the supplied scene. Preserve its scene_id and activity kind. Do not "
                "return the storyline, media, other activities, or a wrapper object."
            ),
            output_schema=ActivitySpec,
            max_output_tokens=5000,
        ),
    }
