from __future__ import annotations

import json
import unittest

import httpx
from artham_partner.story_pipeline.clients.exa import ExaClient
from artham_partner.story_pipeline.contracts import (
    StoryGenerationRequest,
    SubjectRef,
)

from tests.helpers import settings


class ExaClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_image_reachability_falls_back_to_ranged_get(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            if request.method == "HEAD":
                return httpx.Response(403, headers={"content-type": "text/plain"})
            self.assertEqual(request.headers["range"], "bytes=0-1023")
            return httpx.Response(
                206,
                headers={"content-type": "image/png"},
                content=b"image",
            )

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = ExaClient(settings(), http_client=http)

        self.assertTrue(
            await client._image_is_reachable(
                "https://upload.wikimedia.org/reference.png"
            )
        )
        await http.aclose()

    async def test_research_parses_grounded_sources(self) -> None:
        calls = 0

        async def handler(request: httpx.Request) -> httpx.Response:
            nonlocal calls
            if request.method == "HEAD":
                return httpx.Response(
                    200,
                    headers={"content-type": "image/svg+xml"},
                )
            calls += 1
            self.assertEqual(request.headers["x-api-key"], "test-exa")
            body = json.loads(request.content)
            self.assertEqual(body["type"], "deep")
            self.assertIn("semiconductors", body["query"])
            if calls == 2:
                self.assertEqual(
                    body["includeDomains"], ["commons.wikimedia.org"]
                )
                return httpx.Response(
                    200,
                    json={
                        "results": [
                            {
                                "title": f"File: Learning diagram {index}",
                                "url": (
                                    "https://commons.wikimedia.org/wiki/"
                                    f"File:Learning_diagram_{index}.svg"
                                ),
                                "author": f"Open author {index}",
                                "image": (
                                    "https://upload.wikimedia.org/"
                                    f"learning-{index}.svg"
                                ),
                                "text": (
                                    "This educational diagram is licensed under "
                                    "CC BY-SA 4.0 and explains the system clearly."
                                ),
                            }
                            for index in range(3)
                        ]
                    },
                )
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "title": f"Source {index}",
                            "url": f"https://source.test/{index}",
                            "publishedDate": "2026-08-01T00:00:00Z",
                            "highlights": [
                                (
                                    "A sufficiently detailed excerpt about a real "
                                    f"academic development number {index}."
                                )
                            ],
                        }
                        for index in range(3)
                    ]
                },
            )

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = ExaClient(settings(), http_client=http)
        result = await client.research_topics(
            StoryGenerationRequest(
                learner_id="learner",
                idempotency_key="request-key",
                preferred_subjects=[
                    SubjectRef(
                        domain="engineering",
                        discipline="electronics",
                        topic_tags=["semiconductors"],
                    )
                ],
            )
        )
        self.assertEqual(len(result.sources), 3)
        self.assertEqual(len(result.reference_images), 3)
        self.assertEqual(
            result.reference_images[0].license_name, "CC BY-SA 4.0"
        )
        self.assertEqual(calls, 2)
        await http.aclose()


if __name__ == "__main__":
    unittest.main()
