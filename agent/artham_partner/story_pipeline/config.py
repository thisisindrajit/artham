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
    image_model: str
    veo_model: str
    lyria_model: str
    embedding_model: str
    exa_api_key: str | None
    exa_base_url: str
    backend_base_url: str | None
    backend_api_key: str | None
    request_timeout_seconds: float
    media_timeout_seconds: float
    max_media_concurrency: int

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
                "ARTHAM_PIPELINE_MODEL", DEFAULT_PIPELINE_MODEL
            ),
            fast_model=os.environ.get("ARTHAM_FAST_MODEL", DEFAULT_FAST_MODEL),
            image_model=os.environ.get(
                "ARTHAM_IMAGE_MODEL",
                os.environ.get("ARTHAM_IMAGEN_MODEL", DEFAULT_IMAGE_MODEL),
            ),
            veo_model=os.environ.get("ARTHAM_VEO_MODEL", DEFAULT_VEO_MODEL),
            lyria_model=os.environ.get("ARTHAM_LYRIA_MODEL", DEFAULT_LYRIA_MODEL),
            embedding_model=os.environ.get(
                "ARTHAM_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL
            ),
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
        )

    def validate_for_generation(self) -> None:
        missing: list[str] = []
        if not self.google_cloud_project:
            missing.append("GOOGLE_CLOUD_PROJECT")
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
