"""Gemini Flash-powered analysis for live story sessions."""

from __future__ import annotations

from .clients.vertex import VertexClient
from .partner_contracts import (
    ObserveOutput,
    ObserveRequest,
    PreludeOutput,
    PreludeRequest,
    ProfileOutput,
    ProfileRequest,
)
from .prompts.partner import observe_prompt, prelude_prompt, profile_prompt


class FlashThinkingEngine:
    def __init__(self, vertex: VertexClient) -> None:
        self._vertex = vertex

    async def prelude(self, request: PreludeRequest) -> PreludeOutput:
        return await self._vertex.generate_structured(
            prompt=prelude_prompt(request.model_dump(mode="json", by_alias=True)),
            output_model=PreludeOutput,
            max_output_tokens=1200,
        )

    async def observe(self, request: ObserveRequest) -> ObserveOutput:
        return await self._vertex.generate_structured(
            prompt=observe_prompt(request.model_dump(mode="json", by_alias=True)),
            output_model=ObserveOutput,
            max_output_tokens=900,
        )

    async def profile(self, request: ProfileRequest) -> ProfileOutput:
        return await self._vertex.generate_structured(
            prompt=profile_prompt(request.model_dump(mode="json", by_alias=True)),
            output_model=ProfileOutput,
            max_output_tokens=1900,
        )
