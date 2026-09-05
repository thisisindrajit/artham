"""Tests for the OpenRouter image and video client."""

from __future__ import annotations

import base64
import unittest
from unittest.mock import patch

import httpx

from artham_partner.story_pipeline.clients.openrouter import OpenRouterClient
from artham_partner.story_pipeline.clients.vertex import GeneratedBinary
from artham_partner.story_pipeline.contracts import ImageRequest, VideoRequest
from artham_partner.story_pipeline.errors import ConfigurationError, ProviderError

from .helpers import settings

PROMPT = "A bright classroom diagram explaining how a signal splits into waves."


def _client(handler: httpx.MockTransport, **overrides: object) -> OpenRouterClient:
    base = settings()
    values = {
        "image_model": "openrouter/google/gemini-2.5-flash-image",
        "veo_model": "openrouter/google/veo-3.1",
        **overrides,
    }
    configured = type(base)(
        **{
            field: values.get(field, getattr(base, field))
            for field in base.__slots__
        }
    )
    return OpenRouterClient(
        configured, http_client=httpx.AsyncClient(transport=handler)
    )


class OpenRouterImageTests(unittest.IsolatedAsyncioTestCase):
    async def test_safety_refusal_retries_with_softened_prompt(self) -> None:
        prompts: list[str] = []

        def handler(request: httpx.Request) -> httpx.Response:
            import json

            prompts.append(json.loads(request.content)["prompt"])
            if len(prompts) == 1:
                return httpx.Response(
                    400, json={"error": {"message": "blocked by safety filter"}}
                )
            return httpx.Response(
                200,
                json={
                    "data": [
                        {
                            "b64_json": base64.b64encode(b"png").decode(),
                            "media_type": "image/png",
                        }
                    ]
                },
            )

        client = _client(httpx.MockTransport(handler))
        result = await client.generate_image(
            ImageRequest(
                asset_key="scene-1",
                scene_id=None,
                prompt=PROMPT,
                alt_text="a classroom diagram",
                aspect_ratio="16:9",
            )
        )
        self.assertEqual(result.data, b"png")
        self.assertEqual(len(prompts), 2)
        self.assertNotEqual(prompts[0], prompts[1])

    async def test_sends_stripped_slug_and_decodes_image(self) -> None:
        captured: dict[str, object] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["url"] = str(request.url)
            captured["body"] = request.read()
            captured["auth"] = request.headers.get("authorization")
            return httpx.Response(
                200,
                json={
                    "data": [
                        {
                            "b64_json": base64.b64encode(b"png-bytes").decode(),
                            "media_type": "image/png",
                        }
                    ]
                },
            )

        client = _client(httpx.MockTransport(handler))
        result = await client.generate_image(
            ImageRequest(
                asset_key="cover",
                prompt=PROMPT,
                alt_text="a classroom diagram",
            )
        )

        self.assertEqual(result.data, b"png-bytes")
        self.assertEqual(result.content_type, "image/png")
        # The openrouter/ routing prefix must not reach the wire.
        self.assertEqual(result.provider_model, "google/gemini-2.5-flash-image")
        self.assertIn("/images", str(captured["url"]))
        self.assertEqual(captured["auth"], "Bearer test-openrouter")

    async def test_reference_binary_is_sent_as_input_reference(self) -> None:
        captured: dict[str, object] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["body"] = request.read().decode()
            return httpx.Response(
                200,
                json={
                    "data": [{"b64_json": base64.b64encode(b"x").decode()}]
                },
            )

        client = _client(httpx.MockTransport(handler))
        await client.generate_image(
            ImageRequest(
                asset_key="scene-1",
                scene_id="scene-1",
                prompt=PROMPT,
                alt_text="a scene image",
            ),
            reference=GeneratedBinary(
                data=b"ref",
                content_type="image/png",
                provider_model="prior",
            ),
        )

        body = str(captured["body"])
        self.assertIn("input_references", body)
        self.assertIn(
            base64.b64encode(b"ref").decode(),
            body,
        )
        self.assertIn("Match the character designs", body)

    async def test_missing_image_payload_raises_provider_error(self) -> None:
        client = _client(
            httpx.MockTransport(lambda _: httpx.Response(200, json={"data": []}))
        )
        with self.assertRaises(ProviderError):
            await client.generate_image(
                ImageRequest(
                    asset_key="cover", prompt=PROMPT, alt_text="a classroom diagram"
                )
            )

    async def test_non_openrouter_model_is_rejected(self) -> None:
        client = _client(
            httpx.MockTransport(lambda _: httpx.Response(200, json={})),
            image_model="imagen-4.0-generate-001",
        )
        with self.assertRaises(ConfigurationError):
            await client.generate_image(
                ImageRequest(
                    asset_key="cover", prompt=PROMPT, alt_text="a classroom diagram"
                )
            )


class OpenRouterVideoTests(unittest.IsolatedAsyncioTestCase):
    async def test_polls_until_complete_then_downloads(self) -> None:
        statuses = iter(["processing", "completed"])

        def handler(request: httpx.Request) -> httpx.Response:
            url = str(request.url)
            if url.endswith("/videos"):
                return httpx.Response(
                    200,
                    json={
                        "id": "job-1",
                        "status": "processing",
                        "polling_url": "https://openrouter.test/poll",
                    },
                )
            if url == "https://openrouter.test/poll":
                state = next(statuses)
                body: dict[str, object] = {"status": state}
                if state == "completed":
                    body["unsigned_urls"] = ["https://cdn.test/clip.mp4"]
                return httpx.Response(200, json=body)
            return httpx.Response(200, content=b"mp4-bytes")

        client = _client(httpx.MockTransport(handler))
        with patch(
            "artham_partner.story_pipeline.clients.openrouter"
            ".VIDEO_POLL_INTERVAL_SECONDS",
            0,
        ):
            result = await client.generate_video(
                VideoRequest(
                    asset_key="scene-video",
                    scene_id="scene-1",
                    prompt=PROMPT + " Show the waves separating over time.",
                    narrative_necessity=(
                        "Motion is required to show the waves separating."
                    ),
                )
            )

        self.assertEqual(result.data, b"mp4-bytes")
        self.assertEqual(result.content_type, "video/mp4")
        self.assertEqual(result.duration_seconds, 8.0)
        self.assertEqual(result.provider_model, "google/veo-3.1")

    async def test_failed_job_raises_provider_error(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            if str(request.url).endswith("/videos"):
                return httpx.Response(
                    200,
                    json={
                        "status": "processing",
                        "polling_url": "https://openrouter.test/poll",
                    },
                )
            return httpx.Response(200, json={"status": "failed", "error": "nope"})

        client = _client(httpx.MockTransport(handler))
        with patch(
            "artham_partner.story_pipeline.clients.openrouter"
            ".VIDEO_POLL_INTERVAL_SECONDS",
            0,
        ):
            with self.assertRaises(ProviderError):
                await client.generate_video(
                    VideoRequest(
                        asset_key="scene-video",
                        scene_id="scene-1",
                        prompt=PROMPT + " Show the waves separating over time.",
                        narrative_necessity=(
                            "Motion is required to show the waves separating."
                        ),
                    )
                )


if __name__ == "__main__":
    unittest.main()
