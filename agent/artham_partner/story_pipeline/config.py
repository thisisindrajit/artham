"""Environment-backed configuration for external providers and ADK agents."""

from __future__ import annotations

from dataclasses import dataclass
import os

from .constants import (
    DEFAULT_EMBEDDING_MODEL,
    DEFAULT_FAST_MODEL,
    DEFAULT_IMAGE_MODEL,
    DEFAULT_LYRIA_MODEL,
    DEFAULT_MAX_MEDIA_CONCURRENCY,
    DEFAULT_MEDIA_TIMEOUT_SECONDS,
    DEFAULT_PIPELINE_MODEL,
    PROVIDER_REQUEST_SPACING_SECONDS,
    DEFAULT_REQUEST_TIMEOUT_SECONDS,
    DEFAULT_VEO_MODEL,
)
from .errors import ConfigurationError


def _positive_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    value = float(raw) if raw else default
    if value <= 0:
        raise ConfigurationError(f"{name} must be greater than zero")
    return value


def _positive_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    value = int(raw) if raw else default
    if value <= 0:
        raise ConfigurationError(f"{name} must be greater than zero")
    return value


@dataclass(frozen=True, slots=True)
class PipelineSettings:
    """All mutable deployment choices, loaded once per pipeline runtime."""

    google_cloud_project: str | None
    google_cloud_location: str
    vertex_media_location: str
    pipeline_model: str
    fast_model: str
    critic_model: str
    topic_model: str
    session_database_url: str
    image_model: str
    veo_model: str
    lyria_model: str
    embedding_model: str
    openai_api_key: str | None
    openrouter_api_key: str | None
    openrouter_base_url: str
    exa_api_key: str | None
    exa_base_url: str
    backend_base_url: str | None
    backend_api_key: str | None
    request_timeout_seconds: float
    media_timeout_seconds: float
    max_media_concurrency: int
    provider_request_spacing_seconds: float = PROVIDER_REQUEST_SPACING_SECONDS

    @classmethod
    def from_env(cls) -> "PipelineSettings":
        return cls(
            google_cloud_project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
            google_cloud_location=os.environ.get(
                "GOOGLE_CLOUD_LOCATION", "global"
            ),
            vertex_media_location=os.environ.get(
                "ARTHAM_VERTEX_MEDIA_LOCATION", "us-central1"
            ),
            pipeline_model=os.environ.get(
                "ARTHAM_ARCHITECT_MODEL",
                os.environ.get("ARTHAM_PIPELINE_MODEL", DEFAULT_PIPELINE_MODEL),
            ),
            fast_model=os.environ.get(
                "ARTHAM_WORKER_MODEL",
                os.environ.get("ARTHAM_FAST_MODEL", DEFAULT_FAST_MODEL),
            ),
            critic_model=os.environ.get(
                "ARTHAM_CRITIC_MODEL",
                os.environ.get(
                    "ARTHAM_ARCHITECT_MODEL",
                    os.environ.get(
                        "ARTHAM_PIPELINE_MODEL", DEFAULT_PIPELINE_MODEL
                    ),
                ),
            ),
            topic_model=os.environ.get(
                "ARTHAM_TOPIC_MODEL",
                os.environ.get(
                    "ARTHAM_WORKER_MODEL",
                    os.environ.get("ARTHAM_FAST_MODEL", DEFAULT_FAST_MODEL),
                ),
            ),
            session_database_url=os.environ.get(
                "ARTHAM_SESSION_DATABASE_URL",
                "sqlite+aiosqlite:////tmp/artham-adk-sessions.db",
            ),
            image_model=os.environ.get(
                "ARTHAM_IMAGE_MODEL",
                os.environ.get("ARTHAM_IMAGEN_MODEL", DEFAULT_IMAGE_MODEL),
            ),
            veo_model=os.environ.get("ARTHAM_VEO_MODEL", DEFAULT_VEO_MODEL),
            lyria_model=os.environ.get("ARTHAM_LYRIA_MODEL", DEFAULT_LYRIA_MODEL),
            embedding_model=os.environ.get(
                "ARTHAM_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL
            ),
            openai_api_key=os.environ.get("OPENAI_API_KEY"),
            openrouter_api_key=os.environ.get("OPENROUTER_API_KEY"),
            openrouter_base_url=os.environ.get(
                "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
            ).rstrip("/"),
            exa_api_key=os.environ.get("EXA_API_KEY"),
            exa_base_url=os.environ.get("EXA_BASE_URL", "https://api.exa.ai"),
            backend_base_url=os.environ.get("ARTHAM_BACKEND_BASE_URL"),
            backend_api_key=os.environ.get("ARTHAM_BACKEND_API_KEY"),
            request_timeout_seconds=_positive_float(
                "ARTHAM_PROVIDER_TIMEOUT_SECONDS",
                DEFAULT_REQUEST_TIMEOUT_SECONDS,
            ),
            media_timeout_seconds=_positive_float(
                "ARTHAM_MEDIA_TIMEOUT_SECONDS",
                DEFAULT_MEDIA_TIMEOUT_SECONDS,
            ),
            max_media_concurrency=_positive_int(
                "ARTHAM_MAX_MEDIA_CONCURRENCY",
                DEFAULT_MAX_MEDIA_CONCURRENCY,
            ),
            provider_request_spacing_seconds=_nonnegative_float(
                "ARTHAM_PROVIDER_REQUEST_SPACING_SECONDS",
                PROVIDER_REQUEST_SPACING_SECONDS,
            ),
        )

    @property
    def openrouter_image_model(self) -> str | None:
        """The OpenRouter slug for images, or None when images stay on Vertex."""
        return _openrouter_slug(self.image_model)

    @property
    def openrouter_video_model(self) -> str | None:
        """The OpenRouter slug for video, or None when video stays on Vertex."""
        return _openrouter_slug(self.veo_model)

    def validate_for_generation(self) -> None:
        missing: list[str] = []
        if not self.google_cloud_project:
            missing.append("GOOGLE_CLOUD_PROJECT")
        if (
            self.pipeline_model.startswith("openai/")
            or self.fast_model.startswith("openai/")
            or self.critic_model.startswith("openai/")
            or self.topic_model.startswith("openai/")
        ) and not self.openai_api_key:
            missing.append("OPENAI_API_KEY")
        # Fail here rather than deep inside a media or reasoning worker, where
        # the error surfaces as an opaque node failure.
        if (
            any(
                model.startswith("openrouter/")
                for model in (
                    self.pipeline_model,
                    self.fast_model,
                    self.critic_model,
                    self.topic_model,
                )
            )
            or self.openrouter_image_model
            or self.openrouter_video_model
        ) and not self.openrouter_api_key:
            missing.append("OPENROUTER_API_KEY")
        if not self.exa_api_key:
            missing.append("EXA_API_KEY")
        if not self.backend_base_url:
            missing.append("ARTHAM_BACKEND_BASE_URL")
        if not self.backend_api_key:
            missing.append("ARTHAM_BACKEND_API_KEY")
        if missing:
            raise ConfigurationError(
                "Missing story pipeline configuration: " + ", ".join(missing)
            )


def _openrouter_slug(model: str) -> str | None:
    """Strip the ``openrouter/`` routing prefix, or None if not OpenRouter."""
    prefix = "openrouter/"
    return model[len(prefix) :] if model.startswith(prefix) else None


def _nonnegative_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    value = float(raw) if raw else default
    if value < 0:
        raise ConfigurationError(f"{name} must not be negative")
    return value
