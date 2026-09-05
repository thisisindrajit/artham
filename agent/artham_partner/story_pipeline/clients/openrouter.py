"""OpenRouter adapters for image and video generation."""

from __future__ import annotations

import asyncio
import base64
import binascii
from typing import Any

import httpx

from ..config import PipelineSettings
from ..contracts import ImageRequest, VideoRequest
from ..errors import ConfigurationError, ProviderError
from .http import request_with_retries
from .vertex import GeneratedBinary, _safety_adjusted_image_prompt

VIDEO_POLL_INTERVAL_SECONDS = 15.0


class OpenRouterClient:
    """Generates images and videos through OpenRouter's dedicated media APIs."""

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

    async def close(self) -> None:
        if self._owns_http:
            await self._http.aclose()

    async def generate_image(
        self,
        request: ImageRequest,
        *,
        reference: GeneratedBinary | None = None,
    ) -> GeneratedBinary:
        model = self._settings.openrouter_image_model
        if not model:
            raise ConfigurationError(
                "ARTHAM_IMAGE_MODEL must use the openrouter/ prefix"
            )
        prompt = request.prompt
        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "aspect_ratio": request.aspect_ratio,
            "n": 1,
        }
        if reference is not None:
            payload["prompt"] = (
                "Match the character designs, color palette, and art style "
                "of the attached reference image exactly. Do not reuse its "
                f"composition or action. New scene: {prompt}"
            )
            payload["input_references"] = [
                {
                    "type": "image_url",
                    "image_url": {"url": _data_url(reference)},
                }
            ]

        return await self._post_image(payload, model)

    async def _post_image(
        self,
        payload: dict[str, Any],
        model: str,
        *,
        retry_on_safety: bool = False,
    ) -> GeneratedBinary:
        response = await request_with_retries(
            self._http,
            "POST",
            f"{self._settings.openrouter_base_url}/images",
            headers=self._headers(),
            json=payload,
        )
        if response.status_code >= 400:
            if _is_safety_refusal(response) and not retry_on_safety:
                payload["prompt"] = _safety_adjusted_image_prompt(
                    payload["prompt"]
                )
                return await self._post_image(
                    payload, model, retry_on_safety=True
                )
            raise ProviderError(
                f"OpenRouter image returned status {response.status_code}: "
                f"{response.text[:500]}"
            )
        images = response.json().get("data") or []
        if not images or not images[0].get("b64_json"):
            raise ProviderError("OpenRouter produced no usable image")
        entry = images[0]
        return GeneratedBinary(
            data=_decode(entry["b64_json"], "image"),
            content_type=entry.get("media_type") or "image/png",
            provider_model=model,
        )

    async def generate_video(self, request: VideoRequest) -> GeneratedBinary:
        model = self._settings.openrouter_video_model
        if not model:
            raise ConfigurationError(
                "ARTHAM_VEO_MODEL must use the openrouter/ prefix"
            )
        response = await request_with_retries(
            self._http,
            "POST",
            f"{self._settings.openrouter_base_url}/videos",
            headers=self._headers(),
            json={
                "model": model,
                "prompt": request.prompt,
                "duration": request.duration_seconds,
                "aspect_ratio": request.aspect_ratio,
                "resolution": "1080p",
            },
        )
        if response.status_code >= 400:
            raise ProviderError(
                f"OpenRouter video returned status {response.status_code}: "
                f"{response.text[:500]}"
            )
        job = response.json()
        polling_url = job.get("polling_url")
        if not polling_url:
            raise ProviderError("OpenRouter video job returned no polling URL")

        deadline = asyncio.get_running_loop().time() + (
            self._settings.media_timeout_seconds
        )
        while True:
            if asyncio.get_running_loop().time() >= deadline:
                raise ProviderError("OpenRouter video generation timed out")
            await asyncio.sleep(VIDEO_POLL_INTERVAL_SECONDS)
            poll = await request_with_retries(
                self._http, "GET", polling_url, headers=self._headers()
            )
            if poll.status_code >= 400:
                raise ProviderError(
                    f"OpenRouter video poll returned status {poll.status_code}"
                )
            status = poll.json()
            state = status.get("status")
            if state == "completed":
                break
            if state == "failed":
                raise ProviderError(
                    f"OpenRouter video generation failed: "
                    f"{status.get('error', 'unknown error')}"
                )

        urls = status.get("unsigned_urls") or []
        if not urls:
            raise ProviderError("OpenRouter video completed without a content URL")
        download = await request_with_retries(self._http, "GET", urls[0])
        if download.status_code >= 400 or not download.content:
            raise ProviderError("OpenRouter video could not be downloaded")
        return GeneratedBinary(
            data=download.content,
            content_type="video/mp4",
            provider_model=model,
            duration_seconds=float(request.duration_seconds),
        )

    def _headers(self) -> dict[str, str]:
        key = self._settings.openrouter_api_key
        if not key:
            raise ConfigurationError("OPENROUTER_API_KEY is required")
        return {
            "authorization": f"Bearer {key}",
            "content-type": "application/json",
        }


def _data_url(reference: GeneratedBinary) -> str:
    encoded = base64.b64encode(reference.data).decode("ascii")
    return f"data:{reference.content_type};base64,{encoded}"


def _decode(payload: str, label: str) -> bytes:
    try:
        return base64.b64decode(payload, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ProviderError(f"OpenRouter returned invalid {label} data") from exc


def _is_safety_refusal(response: httpx.Response) -> bool:
    """Detects content-policy refusals, which are worth a softened retry."""
    if response.status_code not in (400, 403, 422):
        return False
    body = response.text.lower()
    return any(
        marker in body
        for marker in ("safety", "content_policy", "content policy", "blocked")
    )
