"""Vertex AI adapters for image, video, audio, and text embeddings."""

from __future__ import annotations

import asyncio
import base64
import binascii
import re
import uuid
from dataclasses import dataclass
from typing import Any, TypeVar

import httpx
from google import auth, genai
from google.auth.transport.requests import Request as AuthRequest
from google.genai import errors, types
from pydantic import BaseModel, ValidationError

from ..config import PipelineSettings
from ..contracts import (
    AudioRequest,
    EmbeddingRecord,
    ImageRequest,
    VideoRequest,
)
from ..errors import ConfigurationError, ProviderError
from ..constants import (
    EMBEDDING_REQUEST_SPACING_SECONDS,
    RATE_LIMIT_RETRY_DELAY_SECONDS,
)
from .http import request_with_retries

TModel = TypeVar("TModel", bound=BaseModel)


@dataclass(frozen=True, slots=True)
class GeneratedBinary:
    data: bytes
    content_type: str
    provider_model: str
    duration_seconds: float | None = None


class VertexClient:
    def __init__(
        self,
        settings: PipelineSettings,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._settings = settings
        self._http = http_client or httpx.AsyncClient(
            timeout=settings.media_timeout_seconds
        )
        self._owns_http = http_client is None
        self._clients: dict[str, genai.Client] = {}

    async def close(self) -> None:
        if self._owns_http:
            await self._http.aclose()
        for client in self._clients.values():
            client.close()

    async def generate_structured(
        self,
        *,
        prompt: str,
        output_model: type[TModel],
        max_output_tokens: int = 1200,
    ) -> TModel:
        """Generate a small validated JSON response with the configured Flash model."""
        last_error: ValidationError | None = None
        correction = ""
        for attempt in range(2):
            response = await self._client(
                self._settings.google_cloud_location
            ).aio.models.generate_content(
                model=self._settings.fast_model,
                contents=f"{prompt}{correction}",
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=max_output_tokens,
                    thinking_config=types.ThinkingConfig(
                        thinking_level=types.ThinkingLevel.MINIMAL
                    ),
                    response_mime_type="application/json",
                    response_json_schema=_structured_schema(output_model),
                ),
            )
            if not response.text:
                raise ProviderError("Flash model returned no structured response")
            try:
                return output_model.model_validate_json(response.text)
            except ValidationError as exc:
                last_error = exc
                if attempt == 0:
                    correction = (
                        "\n\nYour previous response violated the output schema. "
                        "Return a complete corrected JSON object only. Errors: "
                        f"{exc.errors(include_url=False)}"
                    )
        raise ProviderError(
            "Flash model returned invalid structured output: "
            f"{last_error.errors(include_url=False) if last_error else 'unknown error'}"
        ) from last_error

    async def generate_image(self, request: ImageRequest) -> GeneratedBinary:
        if not self._settings.image_model.startswith("imagen-"):
            empty_response_details = "no response"
            prompt = request.prompt
            for attempt in range(2):
                try:
                    response = await self._client(
                        self._settings.google_cloud_location
                    ).aio.models.generate_content(
                        model=self._settings.image_model,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_modalities=["IMAGE"],
                            image_config=types.ImageConfig(
                                aspect_ratio=request.aspect_ratio,
                                image_size="1K",
                                person_generation="ALLOW_ADULT",
                            ),
                        ),
                    )
                except errors.ClientError as exc:
                    if exc.code != 429 or attempt == 1:
                        raise
                    await asyncio.sleep(RATE_LIMIT_RETRY_DELAY_SECONDS)
                    continue

                for part in response.parts or []:
                    inline_data = part.inline_data
                    if inline_data and inline_data.data:
                        return GeneratedBinary(
                            data=inline_data.data,
                            content_type=inline_data.mime_type or "image/png",
                            provider_model=self._settings.image_model,
                        )

                empty_response_details = _image_response_details(response)
                if attempt == 1:
                    break
                if "IMAGE_SAFETY" in empty_response_details:
                    prompt = _safety_adjusted_image_prompt(prompt)
                await asyncio.sleep(min(5 * (2**attempt), 30))
            raise ProviderError(
                "Vertex produced no usable image after retries: "
                f"{empty_response_details}"
            )

        response = await self._client(
            self._settings.vertex_media_location
        ).aio.models.generate_images(
            model=self._settings.image_model,
            prompt=request.prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio=request.aspect_ratio,
                output_mime_type="image/webp",
                include_rai_reason=True,
                safety_filter_level="block_medium_and_above",
                person_generation="allow_adult",
                add_watermark=True,
            ),
        )
        images = response.generated_images or []
        if not images or not images[0].image or not images[0].image.image_bytes:
            reason = images[0].rai_filtered_reason if images else "no image"
            raise ProviderError(f"Imagen produced no usable image: {reason}")
        image = images[0].image
        return GeneratedBinary(
            data=image.image_bytes,
            content_type=image.mime_type or "image/webp",
            provider_model=self._settings.image_model,
        )

    async def generate_video(self, request: VideoRequest) -> GeneratedBinary:
        client = self._client(self._settings.vertex_media_location)
        operation = await client.aio.models.generate_videos(
            model=self._settings.veo_model,
            prompt=request.prompt,
            config=types.GenerateVideosConfig(
                number_of_videos=1,
                duration_seconds=request.duration_seconds,
                aspect_ratio=request.aspect_ratio,
                resolution="1080p",
                generate_audio=False,
                enhance_prompt=True,
            ),
        )
        deadline = asyncio.get_running_loop().time() + (
            self._settings.media_timeout_seconds
        )
        while not operation.done:
            if asyncio.get_running_loop().time() >= deadline:
                raise ProviderError("Veo generation timed out")
            await asyncio.sleep(10)
            operation = await client.aio.operations.get(operation)

        response = operation.response
        videos = response.generated_videos if response else None
        if not videos or not videos[0].video:
            reasons = response.rai_media_filtered_reasons if response else None
            raise ProviderError(f"Veo produced no usable video: {reasons}")
        video = videos[0].video
        data = video.video_bytes
        if not data:
            data = await asyncio.to_thread(client.files.download, file=video)
        if not data:
            raise ProviderError("Veo video could not be downloaded")
        return GeneratedBinary(
            data=data,
            content_type=video.mime_type or "video/mp4",
            provider_model=self._settings.veo_model,
            duration_seconds=float(request.duration_seconds),
        )

    async def generate_audio(self, request: AudioRequest) -> GeneratedBinary:
        project = self._require_project()
        token = await asyncio.to_thread(self._access_token)
        prompt = request.prompt
        if request.negative_prompt:
            prompt += f"\nAvoid: {request.negative_prompt}"
        response = await request_with_retries(
            self._http,
            "POST",
            (
                "https://aiplatform.googleapis.com/v1beta1/projects/"
                f"{project}/locations/global/interactions"
            ),
            headers={
                "authorization": f"Bearer {token}",
                "content-type": "application/json",
            },
            json={
                "model": self._settings.lyria_model,
                "input": prompt,
            },
        )
        if response.status_code >= 400:
            if response.status_code == 400 and "content_blocked" in response.text:
                if request.negative_prompt:
                    return await self.generate_audio(
                        request.model_copy(update={"negative_prompt": ""})
                    )
                safe_prompt = (
                    "Loopable instrumental background music for a fictional "
                    "educational science adventure. Restrained electronic pulse, "
                    "warm melodic textures, gentle tension, a curious discovery "
                    "arc, and a calm resolution. No vocals and no references to "
                    "existing music."
                )
                if request.prompt != safe_prompt:
                    return await self.generate_audio(
                        request.model_copy(update={"prompt": safe_prompt})
                    )
            raise ProviderError(
                f"Lyria returned status {response.status_code}: "
                f"{response.text[:500]}"
            )
        payload = response.json()
        audio = _find_audio_output(payload)
        if audio is None:
            raise ProviderError("Lyria produced no usable audio")
        try:
            data = base64.b64decode(audio["data"], validate=True)
        except (ValueError, binascii.Error) as exc:
            raise ProviderError("Lyria returned invalid audio data") from exc
        return GeneratedBinary(
            data=data,
            content_type=_normalize_audio_mime(audio.get("mime_type")),
            provider_model=self._settings.lyria_model,
        )

    async def embed(
        self, items: list[tuple[str, str, str]]
    ) -> list[EmbeddingRecord]:
        """Embed tuples sequentially to stay below shared Vertex quotas."""
        if not items:
            return []
        client = self._client(self._settings.google_cloud_location)
        async def embed_one(
            item: tuple[str, str, str],
        ) -> EmbeddingRecord:
            content_key, content_type, text = item
            response = await client.aio.models.embed_content(
                model=self._settings.embedding_model,
                contents=[text],
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=768,
                    auto_truncate=True,
                ),
            )
            embeddings = response.embeddings or []
            if len(embeddings) != 1:
                raise ProviderError(
                    f"Vertex returned no embedding for {content_key}"
                )
            embedding = embeddings[0]
            values = embedding.values or []
            if not values:
                raise ProviderError(
                    f"Vertex returned an empty embedding for {content_key}"
                )
            return EmbeddingRecord(
                embedding_id=uuid.uuid4().hex,
                content_key=content_key,
                content_type=content_type,
                text=text,
                vector=values,
                dimensions=len(values),
                model=self._settings.embedding_model,
            )

        records = []
        for index, item in enumerate(items):
            if index:
                await asyncio.sleep(EMBEDDING_REQUEST_SPACING_SECONDS)
            records.append(await embed_one(item))
        return records

    def _client(self, location: str) -> genai.Client:
        client = self._clients.get(location)
        if client is None:
            client = genai.Client(
                vertexai=True,
                project=self._require_project(),
                location=location,
            )
            self._clients[location] = client
        return client

    def _require_project(self) -> str:
        if not self._settings.google_cloud_project:
            raise ConfigurationError("GOOGLE_CLOUD_PROJECT is required")
        return self._settings.google_cloud_project

    @staticmethod
    def _access_token() -> str:
        credentials, _ = auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        credentials.refresh(AuthRequest())
        token: Any = credentials.token
        if not isinstance(token, str) or not token:
            raise ConfigurationError("Could not obtain a Google Cloud token")
        return token


def _find_audio_output(payload: Any) -> dict[str, Any] | None:
    """Accept both legacy `outputs` and current Interactions `steps` schemas."""
    if isinstance(payload, dict):
        if (
            payload.get("type") == "audio"
            and isinstance(payload.get("data"), str)
        ):
            return payload
        for key in ("outputs", "steps", "content"):
            found = _find_audio_output(payload.get(key))
            if found is not None:
                return found
    elif isinstance(payload, list):
        for item in payload:
            found = _find_audio_output(item)
            if found is not None:
                return found
    return None


def _normalize_audio_mime(value: Any) -> str:
    if not isinstance(value, str) or not value:
        return "audio/mpeg"
    return "audio/mpeg" if value == "audio/mp3" else value


def _image_response_details(response: Any) -> str:
    feedback = getattr(response, "prompt_feedback", None)
    candidates = getattr(response, "candidates", None) or []
    reasons = [
        str(getattr(candidate, "finish_reason", None))
        for candidate in candidates
        if getattr(candidate, "finish_reason", None) is not None
    ]
    return f"prompt_feedback={feedback!s}; finish_reasons={reasons or ['unknown']}"


def _safety_adjusted_image_prompt(prompt: str) -> str:
    adjusted = re.sub(
        r"\b(teenage|teenager|teen|child|kid|minor)\b",
        "adult",
        prompt,
        flags=re.IGNORECASE,
    )
    return (
        "All people shown are fictional adults age 25 or older. The scene is "
        f"nonviolent and suitable for an educational story. {adjusted}"
    )


def minimal_safe_image_prompt(request: ImageRequest) -> str:
    description = re.sub(
        r"\b(teenage|teenager|teen|child|kid|minor|weapon|blood|injury)\b",
        "",
        request.alt_text,
        flags=re.IGNORECASE,
    )
    return (
        "Minimal educational story illustration in a calm, grounded style. Show "
        "one or two fictional adults age 30 or older, fully clothed, safely working "
        "in an ordinary professional setting. Natural lighting, restrained "
        "expressions, uncluttered composition, no danger, no conflict, no logos, "
        f"and no readable text. Scene: {description}"
    )


def _structured_schema(output_model: type[BaseModel]) -> dict[str, Any]:
    schema = output_model.model_json_schema(by_alias=True)

    def strip_unsupported(value: Any) -> None:
        if isinstance(value, dict):
            value.pop("minItems", None)
            value.pop("maxItems", None)
            value.pop("exclusiveMinimum", None)
            value.pop("exclusiveMaximum", None)
            for child in value.values():
                strip_unsupported(child)
        elif isinstance(value, list):
            for child in value:
                strip_unsupported(child)

    strip_unsupported(schema)
    return schema
