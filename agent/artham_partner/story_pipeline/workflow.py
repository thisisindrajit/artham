"""Root ADK dynamic workflow factory for asynchronous story generation."""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from typing import Any

from google.adk.agents import Context
from google.adk.workflow import Node, Workflow
from google.genai import types
from pydantic import PrivateAttr

from .contracts import (
    StoryGenerationRequest,
    StoryGenerationResult,
)
from .constants import STORY_GENERATION_TIMEOUT_SECONDS
from .orchestrator import ProgressCallback, StoryOrchestrator
from .runtime import PipelineRuntime


class StoryGenerationSupervisor(Node):
    _orchestrator: StoryOrchestrator = PrivateAttr()
    _job_id: str | None = PrivateAttr()

    def __init__(
        self,
        *,
        runtime: PipelineRuntime,
        job_id: str | None = None,
        progress: ProgressCallback | None = None,
    ) -> None:
        super().__init__(
            name="story_generation_supervisor",
            output_schema=StoryGenerationResult,
            rerun_on_resume=True,
            timeout=STORY_GENERATION_TIMEOUT_SECONDS,
        )
        self._orchestrator = StoryOrchestrator(runtime, progress)
        self._job_id = job_id

    async def run_node_impl(
        self, *, ctx: Context, node_input: Any
    ) -> AsyncGenerator[Any, None]:
        request = StoryGenerationRequest.model_validate_json(
            _content_text(node_input)
        )
        yield await self._orchestrator.generate(
            ctx=ctx,
            request=request,
            job_id=self._job_id or request.idempotency_key,
        )


def build_story_workflow(
    *,
    runtime: PipelineRuntime,
    job_id: str | None = None,
    progress: ProgressCallback | None = None,
) -> Workflow:
    supervisor = StoryGenerationSupervisor(
        runtime=runtime,
        job_id=job_id,
        progress=progress,
    )
    return Workflow(
        name="story_generation_pipeline",
        description=(
            "Researches, produces, validates, and persists an educational story."
        ),
        edges=[("START", supervisor)],
        output_schema=StoryGenerationResult,
        max_concurrency=1,
    )


def _content_text(value: Any) -> str:
    if isinstance(value, types.Content):
        text = "".join(part.text or "" for part in value.parts or [])
        if text:
            return text
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return json.dumps(value)
    raise ValueError("Story workflow input must contain a JSON request")
