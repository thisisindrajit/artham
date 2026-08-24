from __future__ import annotations

import unittest
from unittest.mock import AsyncMock, patch

import httpx

from artham_partner.story_pipeline.clients.http import request_with_retries


class HttpClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_honors_retry_after_for_rate_limits(self) -> None:
        responses = iter(
            [
                httpx.Response(429, headers={"Retry-After": "75"}),
                httpx.Response(200, json={"ok": True}),
            ]
        )

        async def handler(_: httpx.Request) -> httpx.Response:
            return next(responses)

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        with patch("asyncio.sleep", new=AsyncMock()) as sleep:
            response = await request_with_retries(
                client,
                "GET",
                "https://provider.example/resource",
            )

        self.assertEqual(response.status_code, 200)
        sleep.assert_awaited_once_with(75.0)
        await client.aclose()
