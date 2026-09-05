"""Runtime dependency container for one story workflow instance."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .clients import (
    BackendClient,
    ExaClient,
    LiteLlmReasoningClient,
    VertexClient,
)
from .clients.openrouter import OpenRouterClient
from .config import PipelineSettings


@dataclass(slots=True)
class PipelineRuntime:
    settings: PipelineSettings
    exa: ExaClient
    backend: BackendClient
    vertex: VertexClient
    reasoning: LiteLlmReasoningClient
    #: Image and video provider. Music and embeddings always stay on Vertex.
    media: VertexClient | OpenRouterClient
    checkpoints: dict[str, dict[str, Any]] = field(default_factory=dict)

    @classmethod
    def from_settings(cls, settings: PipelineSettings) -> "PipelineRuntime":
        vertex = VertexClient(settings)
        media: VertexClient | OpenRouterClient = vertex
        if settings.openrouter_image_model or settings.openrouter_video_model:
            media = OpenRouterClient(settings)
        return cls(
            settings=settings,
            exa=ExaClient(settings),
            backend=BackendClient(settings),
            vertex=vertex,
            reasoning=LiteLlmReasoningClient(settings),
            media=media,
        )

    async def close(self) -> None:
        await self.exa.close()
        await self.backend.close()
        await self.vertex.close()
        if self.media is not self.vertex:
            await self.media.close()
