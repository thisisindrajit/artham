"""Shared asynchronous HTTP behavior with bounded transient retries."""

from __future__ import annotations

import asyncio
from collections.abc import Mapping
from typing import Any

import httpx

from ..constants import (
    RATE_LIMIT_RETRY_DELAY_SECONDS,
    TRANSIENT_HTTP_STATUSES,
    TRANSIENT_RETRY_DELAY_SECONDS,
)
from ..errors import ProviderError


async def request_with_retries(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    attempts: int = 2,
    headers: Mapping[str, str] | None = None,
    json: Any = None,
    content: bytes | None = None,
) -> httpx.Response:
    """Make one HTTP request, retrying only transient failures."""
    last_error: Exception | None = None
    for attempt in range(attempts):
        retry_delay = TRANSIENT_RETRY_DELAY_SECONDS
        try:
            response = await client.request(
                method,
                url,
                headers=headers,
                json=json,
                content=content,
            )
            if response.status_code not in TRANSIENT_HTTP_STATUSES:
                return response
            last_error = ProviderError(
                f"{method} {url} returned transient status "
                f"{response.status_code}"
            )
            if response.status_code == 429:
                retry_after = response.headers.get("retry-after")
                retry_delay = (
                    float(retry_after)
                    if retry_after and retry_after.isdigit()
                    else RATE_LIMIT_RETRY_DELAY_SECONDS
                )
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            last_error = exc

        if attempt + 1 < attempts:
            await asyncio.sleep(retry_delay)

    raise ProviderError(f"{method} {url} failed after {attempts} attempts") from (
        last_error
    )
