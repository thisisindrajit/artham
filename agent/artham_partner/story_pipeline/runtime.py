"""Runtime dependency container for one story workflow instance."""

from __future__ import annotations

from dataclasses import dataclass

from .clients import BackendClient, ExaClient, VertexClient
from .config import PipelineSettings


@dataclass(slots=True)
class PipelineRuntime:
    settings: PipelineSettings
    exa: ExaClient
    backend: BackendClient
    vertex: VertexClient

    @classmethod
    def from_settings(cls, settings: PipelineSettings) -> "PipelineRuntime":
        return cls(
            settings=settings,
            exa=ExaClient(settings),
            backend=BackendClient(settings),
            vertex=VertexClient(settings),
        )

    async def close(self) -> None:
        await self.exa.close()
        await self.backend.close()
        await self.vertex.close()
