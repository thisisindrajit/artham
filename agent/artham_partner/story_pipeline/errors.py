"""Explicit failure types surfaced by the story pipeline."""

from __future__ import annotations


class StoryPipelineError(RuntimeError):
    """Base class for expected pipeline failures."""


class ConfigurationError(StoryPipelineError):
    """Required runtime configuration is missing or invalid."""


class ProviderError(StoryPipelineError):
    """An external provider returned an unusable response."""


class BackendError(StoryPipelineError):
    """The backend contract could not be completed."""


class ValidationFailure(StoryPipelineError):
    """The generated bundle remained invalid after bounded repairs."""


class JobNotFoundError(StoryPipelineError):
    """A requested generation job does not exist."""


class JobConflictError(StoryPipelineError):
    """A request conflicts with an existing idempotent job."""
