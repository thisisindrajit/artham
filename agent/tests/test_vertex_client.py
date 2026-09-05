from __future__ import annotations

import unittest
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
from google.genai.errors import ClientError

from artham_partner.story_pipeline.clients.vertex import (
    GeneratedBinary,
    VertexClient,
    _find_audio_output,
    _normalize_audio_mime,
)
from artham_partner.story_pipeline.contracts import ImageRequest, VideoRequest
from artham_partner.story_pipeline.errors import ProviderError

from tests.helpers import settings


class VertexClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_sends_lyria_prompt_as_string_input(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            payload = json.loads(request.content)
            self.assertEqual(
                payload["input"],
                "Instrumental electronic underscore.\nAvoid: vocals",
            )
            return httpx.Response(
                200,
                json={
                    "steps": [
                        {
                            "type": "model_output",
                            "content": [
                                {
                                    "type": "audio",
                                    "mime_type": "audio/mp3",
                                    "data": "YXVkaW8=",
                                }
                            ],
                        }
                    ]
                },
            )

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = VertexClient(settings(), http_client=http)

        with patch.object(VertexClient, "_access_token", return_value="token"):
            result = await client.generate_audio(
                SimpleNamespace(
                    prompt="Instrumental electronic underscore.",
                    negative_prompt="vocals",
                )
            )

        self.assertEqual(result.data, b"audio")
        self.assertEqual(result.content_type, "audio/mpeg")
        await http.aclose()

    async def test_retries_lyria_without_negative_prompt_after_policy_block(
        self,
    ) -> None:
        inputs: list[str] = []

        async def handler(request: httpx.Request) -> httpx.Response:
            payload = json.loads(request.content)
            inputs.append(payload["input"])
            if len(inputs) == 1:
                return httpx.Response(
                    400,
                    json={
                        "error": {
                            "message": "Request blocked",
                            "code": "content_blocked",
                        }
                    },
                )
            return httpx.Response(
                200,
                json={
                    "outputs": [
                        {
                            "type": "audio",
                            "mime_type": "audio/mpeg",
                            "data": "YXVkaW8=",
                        }
                    ]
                },
            )

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = VertexClient(settings(), http_client=http)

        with patch.object(VertexClient, "_access_token", return_value="token"):
            result = await client.generate_audio(
                SimpleNamespace(
                    prompt="Instrumental educational score.",
                    negative_prompt="alarms",
                    model_copy=lambda update: SimpleNamespace(
                        prompt="Instrumental educational score.",
                        negative_prompt=update["negative_prompt"],
                    ),
                )
            )

        self.assertEqual(result.data, b"audio")
        self.assertEqual(
            inputs,
            [
                "Instrumental educational score.\nAvoid: alarms",
                "Instrumental educational score.",
            ],
        )
        await http.aclose()

    async def test_retries_native_image_generation_after_throttling(self) -> None:
        generated = SimpleNamespace(
            parts=[
                SimpleNamespace(
                    inline_data=SimpleNamespace(
                        data=b"image",
                        mime_type="image/png",
                    )
                )
            ]
        )
        generate_content = AsyncMock(
            side_effect=[
                ClientError(
                    429,
                    {
                        "error": {
                            "code": 429,
                            "message": "quota",
                            "status": "RESOURCE_EXHAUSTED",
                        }
                    },
                ),
                generated,
            ]
        )
        vertex = SimpleNamespace(
            aio=SimpleNamespace(
                models=SimpleNamespace(generate_content=generate_content)
            )
        )
        client = VertexClient(settings(), http_client=httpx.AsyncClient())

        with (
            patch.object(VertexClient, "_client", return_value=vertex),
            patch("asyncio.sleep", new=AsyncMock()) as sleep,
        ):
            result = await client.generate_image(
                ImageRequest(
                    asset_key="scene-one",
                    scene_id="s1",
                    prompt=(
                        "A cinematic animated story frame showing a fictional "
                        "electronics laboratory with no logos or readable text."
                    ),
                    alt_text="A fictional electronics laboratory.",
                )
            )

        self.assertEqual(result.data, b"image")
        self.assertEqual(generate_content.await_count, 2)
        sleep.assert_awaited_once_with(120.0)
        await client.close()

    async def test_retries_native_image_generation_after_empty_response(self) -> None:
        empty = SimpleNamespace(
            parts=[],
            prompt_feedback=None,
            candidates=[SimpleNamespace(finish_reason="OTHER")],
        )
        generated = SimpleNamespace(
            parts=[
                SimpleNamespace(
                    inline_data=SimpleNamespace(
                        data=b"image",
                        mime_type="image/png",
                    )
                )
            ]
        )
        generate_content = AsyncMock(side_effect=[empty, generated])
        vertex = SimpleNamespace(
            aio=SimpleNamespace(
                models=SimpleNamespace(generate_content=generate_content)
            )
        )
        client = VertexClient(settings(), http_client=httpx.AsyncClient())

        with (
            patch.object(VertexClient, "_client", return_value=vertex),
            patch("asyncio.sleep", new=AsyncMock()) as sleep,
        ):
            result = await client.generate_image(
                ImageRequest(
                    asset_key="scene-one",
                    scene_id="s1",
                    prompt=(
                        "A cinematic animated story frame showing a fictional "
                        "electronics laboratory with no logos or readable text."
                    ),
                    alt_text="A fictional electronics laboratory.",
                )
            )

        self.assertEqual(result.data, b"image")
        self.assertEqual(generate_content.await_count, 2)
        sleep.assert_awaited_once_with(5)
        await client.close()

    async def test_conditions_image_on_reference_binary_for_style_match(
        self,
    ) -> None:
        generated = SimpleNamespace(
            parts=[
                SimpleNamespace(
                    inline_data=SimpleNamespace(
                        data=b"image",
                        mime_type="image/png",
                    )
                )
            ]
        )
        generate_content = AsyncMock(return_value=generated)
        vertex = SimpleNamespace(
            aio=SimpleNamespace(
                models=SimpleNamespace(generate_content=generate_content)
            )
        )
        client = VertexClient(settings(), http_client=httpx.AsyncClient())
        reference = GeneratedBinary(
            data=b"cover-bytes",
            content_type="image/webp",
            provider_model="gemini-3.1-flash-lite-image",
        )

        with patch.object(VertexClient, "_client", return_value=vertex):
            result = await client.generate_image(
                ImageRequest(
                    asset_key="scene-one",
                    scene_id="s1",
                    prompt=(
                        "A cinematic animated story frame showing a fictional "
                        "electronics laboratory with no logos or readable text."
                    ),
                    alt_text="A fictional electronics laboratory.",
                ),
                reference=reference,
            )

        self.assertEqual(result.data, b"image")
        contents = generate_content.await_args.kwargs["contents"]
        self.assertIsInstance(contents, list)
        self.assertEqual(contents[0].inline_data.data, b"cover-bytes")
        self.assertIn("Match the character designs", contents[1])
        await client.close()

    async def test_rewrites_age_terms_after_image_safety_block(self) -> None:
        blocked = SimpleNamespace(
            parts=[],
            prompt_feedback=None,
            candidates=[SimpleNamespace(finish_reason="IMAGE_SAFETY")],
        )
        generated = SimpleNamespace(
            parts=[
                SimpleNamespace(
                    inline_data=SimpleNamespace(
                        data=b"image",
                        mime_type="image/png",
                    )
                )
            ]
        )
        generate_content = AsyncMock(side_effect=[blocked, generated])
        vertex = SimpleNamespace(
            aio=SimpleNamespace(
                models=SimpleNamespace(generate_content=generate_content)
            )
        )
        client = VertexClient(settings(), http_client=httpx.AsyncClient())

        with (
            patch.object(VertexClient, "_client", return_value=vertex),
            patch("asyncio.sleep", new=AsyncMock()),
        ):
            result = await client.generate_image(
                ImageRequest(
                    asset_key="scene-one",
                    scene_id="s1",
                    prompt=(
                        "A teenage engineer checks a friendly science display "
                        "with no logos or readable text."
                    ),
                    alt_text="An engineer checks a science display.",
                )
            )

        retry_prompt = generate_content.await_args_list[1].kwargs["contents"]
        self.assertIn("fictional adults age 25 or older", retry_prompt)
        self.assertNotIn("teenage", retry_prompt.lower())
        self.assertEqual(result.data, b"image")
        await client.close()

    async def test_stops_after_two_image_safety_attempts(self) -> None:
        blocked = SimpleNamespace(
            parts=[],
            prompt_feedback=None,
            candidates=[SimpleNamespace(finish_reason="IMAGE_SAFETY")],
        )
        generated = SimpleNamespace(
            parts=[
                SimpleNamespace(
                    inline_data=SimpleNamespace(
                        data=b"image",
                        mime_type="image/png",
                    )
                )
            ]
        )
        generate_content = AsyncMock(side_effect=[blocked, blocked])
        vertex = SimpleNamespace(
            aio=SimpleNamespace(
                models=SimpleNamespace(generate_content=generate_content)
            )
        )
        client = VertexClient(settings(), http_client=httpx.AsyncClient())

        with (
            patch.object(VertexClient, "_client", return_value=vertex),
            patch("asyncio.sleep", new=AsyncMock()),
        ):
            with self.assertRaises(ProviderError):
                await client.generate_image(
                    ImageRequest(
                        asset_key="scene-one",
                        scene_id="s1",
                        prompt=(
                            "A cinematic adult engineer investigates a machine "
                            "with no logos or readable text."
                        ),
                        alt_text="An engineer calmly checks a machine.",
                    )
                )

        self.assertEqual(generate_content.await_count, 2)
        retry_prompt = generate_content.await_args_list[1].kwargs["contents"]
        self.assertIn("fictional adults age 25 or older", retry_prompt)
        await client.close()

    async def test_generates_widescreen_video_at_1080p(self) -> None:
        generate_videos = AsyncMock(
            return_value=SimpleNamespace(
                done=True,
                response=SimpleNamespace(
                    generated_videos=[
                        SimpleNamespace(
                            video=SimpleNamespace(
                                video_bytes=b"video",
                                mime_type="video/mp4",
                            )
                        )
                    ]
                ),
            )
        )
        vertex = SimpleNamespace(
            aio=SimpleNamespace(
                models=SimpleNamespace(generate_videos=generate_videos)
            )
        )
        client = VertexClient(settings(), http_client=httpx.AsyncClient())

        with patch.object(VertexClient, "_client", return_value=vertex):
            result = await client.generate_video(
                VideoRequest(
                    asset_key="scene-video",
                    scene_id="s1",
                    prompt=(
                        "Two teenage investigators test a simple circuit while "
                        "the indicator light changes, with no readable text."
                    ),
                    narrative_necessity=(
                        "The changing light makes the timing of current flow visible."
                    ),
                )
            )

        config = generate_videos.await_args.kwargs["config"]
        self.assertEqual(config.resolution, "1080p")
        self.assertEqual(config.aspect_ratio, "16:9")
        self.assertEqual(result.data, b"video")
        await client.close()

    async def test_embeds_each_content_with_one_vertex_request(self) -> None:
        embed_content = AsyncMock(
            side_effect=[
                SimpleNamespace(
                    embeddings=[SimpleNamespace(values=[0.1, 0.2])]
                ),
                SimpleNamespace(
                    embeddings=[SimpleNamespace(values=[0.3, 0.4])]
                ),
            ]
        )
        vertex = SimpleNamespace(
            aio=SimpleNamespace(
                models=SimpleNamespace(embed_content=embed_content)
            )
        )
        http = httpx.AsyncClient()
        client = VertexClient(settings(), http_client=http)

        with patch.object(VertexClient, "_client", return_value=vertex):
            records = await client.embed(
                [
                    ("story:one", "story", "First story"),
                    ("scene:one", "scene", "First scene"),
                ]
            )

        self.assertEqual([record.content_key for record in records], [
            "story:one",
            "scene:one",
        ])
        self.assertEqual(embed_content.await_count, 2)
        for call in embed_content.await_args_list:
            self.assertEqual(len(call.kwargs["contents"]), 1)
        await http.aclose()

    def test_finds_audio_in_legacy_lyria_response(self) -> None:
        audio = _find_audio_output(
            {
                "outputs": [
                    {
                        "type": "audio",
                        "mime_type": "audio/mpeg",
                        "data": "YXVkaW8=",
                    }
                ]
            }
        )
        self.assertEqual(audio["data"], "YXVkaW8=")

    def test_finds_audio_in_interactions_steps(self) -> None:
        audio = _find_audio_output(
            {
                "steps": [
                    {
                        "type": "model_output",
                        "content": [
                            {
                                "type": "audio",
                                "mime_type": "audio/mpeg",
                                "data": "YXVkaW8=",
                            }
                        ],
                    }
                ]
            }
        )
        self.assertEqual(audio["mime_type"], "audio/mpeg")

    def test_normalizes_lyria_mp3_mime(self) -> None:
        self.assertEqual(_normalize_audio_mime("audio/mp3"), "audio/mpeg")


if __name__ == "__main__":
    unittest.main()
