"""Native `adk run` entry point for the story-generation workflow."""

from __future__ import annotations

from .config import PipelineSettings
from .runtime import PipelineRuntime
from .workflow import build_story_workflow

_runtime = PipelineRuntime.from_settings(PipelineSettings.from_env())

root_agent = build_story_workflow(runtime=_runtime)

__all__ = ["root_agent"]
