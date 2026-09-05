"""OpenAI-compatible JSON schemas for LiteLLM structured outputs."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

_DEFERRED_VALIDATION_KEYWORDS = {
    "default",
    "exclusiveMaximum",
    "exclusiveMinimum",
    "format",
    "maxItems",
    "maxLength",
    "maxProperties",
    "maximum",
    "minItems",
    "minLength",
    "minProperties",
    "minimum",
    "multipleOf",
    "pattern",
    "uniqueItems",
}


def openai_compatible_schema(output_model: type[BaseModel]) -> dict[str, Any]:
    """Return the strict subset accepted by OpenAI structured outputs.

    Pydantic still applies every removed constraint after generation. Keeping the
    provider schema structural avoids request rejection for otherwise useful
    validation hints such as URI formats and string-length bounds.
    """

    schema = output_model.model_json_schema(by_alias=True)

    def normalize(value: Any) -> None:
        if isinstance(value, dict):
            for keyword in _DEFERRED_VALIDATION_KEYWORDS:
                value.pop(keyword, None)
            enum = value.get("enum")
            if isinstance(enum, list) and any(
                not isinstance(item, str) for item in enum
            ):
                value.pop("enum")
            properties = value.get("properties")
            if isinstance(properties, dict):
                value["required"] = list(properties)
                value["additionalProperties"] = False
                for child in properties.values():
                    normalize(child)
            definitions = value.get("$defs")
            if isinstance(definitions, dict):
                for child in definitions.values():
                    normalize(child)
            for key, child in value.items():
                if key in {"$defs", "properties"}:
                    continue
                normalize(child)
        elif isinstance(value, list):
            for child in value:
                normalize(child)

    normalize(schema)
    return schema


def openai_response_format(
    output_model: type[BaseModel],
) -> dict[str, Any]:
    return {"type": "json_object"}
