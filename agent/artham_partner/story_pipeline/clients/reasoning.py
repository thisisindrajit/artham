"""LiteLLM adapter for small structured reasoning requests."""

from __future__ import annotations

import json
from typing import TypeVar

from litellm import acompletion
from pydantic import BaseModel, ValidationError

from ..config import PipelineSettings
from ..errors import ProviderError
from ..structured_schema import (
    openai_compatible_schema,
    openai_response_format,
)

TModel = TypeVar("TModel", bound=BaseModel)


class LiteLlmReasoningClient:
    def __init__(self, settings: PipelineSettings) -> None:
        self._settings = settings

    async def generate_structured(
        self,
        *,
        prompt: str,
        output_model: type[TModel],
        max_output_tokens: int = 1200,
    ) -> TModel:
        last_error: ValidationError | None = None
        correction = ""
        schema = json.dumps(
            openai_compatible_schema(output_model),
            separators=(",", ":"),
        )
        for attempt in range(2):
            kwargs: dict[str, object] = {}
            if self._settings.fast_model.startswith("openrouter/"):
                # Only route to providers that honor response_format, so
                # structured output degrades into an error, not silent prose.
                kwargs["extra_body"] = {"provider": {"require_parameters": True}}
            response = await acompletion(
                model=self._settings.fast_model,
                messages=[
                    {
                        "role": "user",
                        "content": (
                            f"{prompt}{correction}\n\nReturn one JSON object "
                            f"matching this schema:\n{schema}"
                        ),
                    }
                ],
                response_format=openai_response_format(output_model),
                max_tokens=max_output_tokens,
                num_retries=2,
                timeout=self._settings.request_timeout_seconds,
                **kwargs,
            )
            message = response.choices[0].message
            parsed = getattr(message, "parsed", None)
            if isinstance(parsed, output_model):
                return parsed
            content = message.content
            if not isinstance(content, str) or not content:
                raise ProviderError("LiteLLM returned no structured response")
            try:
                return output_model.model_validate_json(_unfence(content))
            except ValidationError as exc:
                last_error = exc
                if attempt == 0:
                    correction = (
                        "\n\nYour previous response violated the output schema. "
                        "Return one complete corrected JSON object only. Errors: "
                        f"{exc.errors(include_url=False)}"
                    )
        raise ProviderError(
            "LiteLLM returned invalid structured output: "
            f"{last_error.errors(include_url=False) if last_error else 'unknown error'}"
        ) from last_error


def _unfence(content: str) -> str:
    """Strip a ```json fence, which some OpenRouter providers still emit."""
    text = content.strip()
    if not text.startswith("```"):
        return text
    body = text[3:]
    if body.lower().startswith("json"):
        body = body[4:]
    return body.rsplit("```", 1)[0].strip() if "```" in body else body.strip()
