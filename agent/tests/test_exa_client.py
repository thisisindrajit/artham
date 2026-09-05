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
    async def test_find_reference_image_returns_none_when_no_results(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"results": []})

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = ExaClient(settings(), http_client=http)

        self.assertIsNone(await client.find_reference_image("pyrrole molecule"))
        await http.aclose()

    async def test_find_reference_image_returns_licensed_match(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            if request.method == "HEAD":
                return httpx.Response(200, headers={"content-type": "image/png"})
            body = json.loads(request.content)
            self.assertIn("pyrrole", body["query"])
            self.assertEqual(body["includeDomains"], ["commons.wikimedia.org"])
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "title": "File: Pyrrole structure",
                            "url": (
                                "https://commons.wikimedia.org/wiki/"
                                "File:Pyrrole_structure.svg"
                            ),
                            "author": "Open author",
                            "image": "https://upload.wikimedia.org/pyrrole.svg",
                            "text": (
                                "This diagram is licensed under CC BY-SA 4.0 and "
                                "shows the five-membered ring."
                            ),
                        }
                    ]
                },
            )

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = ExaClient(settings(), http_client=http)

        result = await client.find_reference_image("pyrrole molecule structure")

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.license_name, "CC BY-SA 4.0")
        await http.aclose()

    async def test_find_reference_image_rejects_unrelated_result(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            if request.method == "HEAD":
                return httpx.Response(200, headers={"content-type": "image/png"})
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "title": "File: Generic classroom",
                            "url": "https://commons.wikimedia.org/wiki/File:classroom.jpg",
                            "author": "Open author",
                            "image": "https://upload.wikimedia.org/classroom.jpg",
                            "text": "A classroom photograph.",
                        }
                    ]
                },
            )

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = ExaClient(settings(), http_client=http)

        self.assertIsNone(await client.find_reference_image("Fourier transform"))
        await http.aclose()

    async def test_find_reference_image_rejects_non_english_metadata(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            if request.method == "HEAD":
                return httpx.Response(200, headers={"content-type": "image/png"})
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "title": "File: Transformée de Fourier",
                            "url": "https://commons.wikimedia.org/wiki/File:fourier.png",
                            "author": "Open author",
                            "image": "https://upload.wikimedia.org/fourier.png",
                            "text": "A diagram of the Fourier transform.",
                        }
                    ]
                },
            )

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = ExaClient(settings(), http_client=http)

        self.assertIsNone(await client.find_reference_image("Fourier transform"))
        await http.aclose()

    async def test_find_reference_image_reads_license_from_badge_markup(
        self,
    ) -> None:
        """Commons file pages usually express the license only as a linked
        badge whose alt text is "attribution"/"share alike", never as the
        literal string "CC BY-SA 3.0". Matching license prose alone silently
        discarded every such image, so the canonical creativecommons.org URL
        must be enough on its own."""

        async def handler(request: httpx.Request) -> httpx.Response:
            if request.method == "HEAD":
                return httpx.Response(200, headers={"content-type": "image/png"})
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "title": "File: Praat spectrogram",
                            "url": (
                                "https://commons.wikimedia.org/wiki/"
                                "File:Praat-spectrogram.png"
                            ),
                            "author": "Open author",
                            "image": (
                                "https://upload.wikimedia.org/spectrogram.png"
                            ),
                            "text": (
                                "I, the copyright holder of this work, hereby "
                                "publish it under the following license: "
                                "![attribution](https://upload.wikimedia.org/"
                                "Cc-by_new_white.svg)![share alike]"
                                "(https://upload.wikimedia.org/Cc-sa_white.svg) "
                                "[https://creativecommons.org/licenses/by-sa/3.0"
                                "](https://creativecommons.org/licenses/by-sa/3.0)"
                            ),
                        }
                    ]
                },
            )

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = ExaClient(settings(), http_client=http)

        result = await client.find_reference_image("audio spectrogram display")

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.license_name, "CC BY-SA 3.0")
        await http.aclose()

    async def test_find_reference_image_rejects_non_commercial_license(
        self,
    ) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            if request.method == "HEAD":
                return httpx.Response(200, headers={"content-type": "image/png"})
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "title": "File: Restricted photo",
                            "url": (
                                "https://commons.wikimedia.org/wiki/"
                                "File:Restricted.jpg"
                            ),
                            "author": "Some author",
                            "image": "https://upload.wikimedia.org/restricted.jpg",
                            "text": (
                                "Published under "
                                "https://creativecommons.org/licenses/by-nc-nd/4.0"
                            ),
                        }
                    ]
                },
            )

        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        client = ExaClient(settings(), http_client=http)

        self.assertIsNone(await client.find_reference_image("restricted subject"))
        await http.aclose()

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
            calls += 1
            self.assertEqual(request.headers["x-api-key"], "test-exa")
            body = json.loads(request.content)
            self.assertEqual(body["type"], "deep")
            self.assertIn("semiconductors", body["query"])
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
        self.assertEqual(calls, 1)
        await http.aclose()

    async def test_research_query_includes_story_brief_when_present(self) -> None:
        captured_query: str | None = None

        async def handler(request: httpx.Request) -> httpx.Response:
            nonlocal captured_query
            body = json.loads(request.content)
            captured_query = body["query"]
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
        story_brief = (
            "A pharma chemist must fix a failing synthesis route for a "
            "life-saving drug before the funding runs out."
        )
        await client.research_topics(
            StoryGenerationRequest(
                learner_id="learner",
                idempotency_key="request-key-brief",
                preferred_subjects=[
                    SubjectRef(
                        domain="natural sciences",
                        discipline="chemistry",
                        topic_tags=["organic-chemistry"],
                    )
                ],
                story_brief=story_brief,
            )
        )

        self.assertIsNotNone(captured_query)
        assert captured_query is not None
        self.assertIn(story_brief, captured_query)
        self.assertIn("Authoritative beginner explanations", captured_query)
        self.assertIn("Assume zero prior topic knowledge", captured_query)
        self.assertIn("what each necessary thing is", captured_query)
        await http.aclose()

    def test_extract_page_summary_strips_boilerplate(self) -> None:
        text = (
            "== Summary ==\n"
            "Description\n"
            "This photograph shows the sun's corona during the 1919 total "
            "solar eclipse, taken to test whether starlight bends near "
            "the sun.\n"
            "Date 29 May 1919\n"
            "Source Own work\n"
            "Author Royal Astronomical Society\n"
            "== Licensing ==\n"
            "This file is licensed under the Creative Commons "
            "Attribution-Share Alike 4.0 International license.\n"
            "You are free: to share, to adapt\n"
            "Category:Solar eclipses\n"
        )

        summary = ExaClient._extract_page_summary(text)

        self.assertIsNotNone(summary)
        assert summary is not None
        self.assertIn("1919 total", summary)
        self.assertNotIn("Licensing", summary)
        self.assertNotIn("You are free", summary)
        self.assertNotIn("Category", summary)

    def test_extract_page_summary_returns_none_when_only_boilerplate(self) -> None:
        text = (
            "This file is licensed under the Creative Commons "
            "Attribution-Share Alike 4.0 International license.\n"
            "You are free: to share, to adapt\n"
            "Permission is granted to copy this file.\n"
        )

        self.assertIsNone(ExaClient._extract_page_summary(text))


if __name__ == "__main__":
    unittest.main()
