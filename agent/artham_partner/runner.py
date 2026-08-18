"""Thin async wrapper around the ADK Runner.

Each capability is stateless: one session per request, no history carried
between calls. That keeps the call budget honest and makes every response
reproducible from its request payload alone.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import TypeVar

from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from pydantic import BaseModel

logger = logging.getLogger("artham.partner")

APP_NAME = "artham"
USER_ID = "learner"

_session_service = InMemorySessionService()
_runners: dict[str, Runner] = {}

TOut = TypeVar("TOut", bound=BaseModel)


class PartnerError(RuntimeError):
    """Raised when the agent could not produce a valid structured response."""


def _runner_for(agent: LlmAgent) -> Runner:
    runner = _runners.get(agent.name)
    if runner is None:
        runner = Runner(
            app_name=APP_NAME,
            agent=agent,
            session_service=_session_service,
        )
        _runners[agent.name] = runner
    return runner


async def run_structured(
    agent: LlmAgent,
    payload: BaseModel,
    output_model: type[TOut],
    timeout: float = 20.0,
) -> TOut:
    """Send `payload` as JSON, return the agent's response parsed into a model."""
    try:
        return await asyncio.wait_for(
            _run(agent, payload, output_model), timeout=timeout
        )
    except asyncio.TimeoutError as exc:
        raise PartnerError(f"{agent.name} timed out after {timeout}s") from exc


async def _run(
    agent: LlmAgent, payload: BaseModel, output_model: type[TOut]
) -> TOut:
    session_id = f"{agent.name}-{uuid.uuid4().hex}"
    await _session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=session_id
    )

    try:
        message = types.Content(
            role="user",
            parts=[types.Part(text=payload.model_dump_json(exclude_none=True))],
        )

        final_text: str | None = None
        async for event in _runner_for(agent).run_async(
            user_id=USER_ID, session_id=session_id, new_message=message
        ):
            if event.is_final_response() and event.content and event.content.parts:
                final_text = "".join(
                    part.text for part in event.content.parts if part.text
                )
    finally:
        await _session_service.delete_session(
            app_name=APP_NAME, user_id=USER_ID, session_id=session_id
        )

    if not final_text:
        raise PartnerError(f"{agent.name} returned no content")

    try:
        return output_model.model_validate_json(final_text)
    except Exception as exc:  # noqa: BLE001 - surfaced as a 502 to the caller
        logger.warning("%s produced unparseable output: %s", agent.name, final_text)
        raise PartnerError(f"{agent.name} returned invalid JSON") from exc
