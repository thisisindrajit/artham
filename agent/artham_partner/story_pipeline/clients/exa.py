"""Minimal async client for Exa search and page-content retrieval."""

from __future__ import annotations

from datetime import datetime
import re
from typing import Any

import httpx

from ..config import PipelineSettings
from ..constants import DEFAULT_EXA_RESULT_COUNT, DEFAULT_EXA_SEARCH_TYPE
from ..contracts import (
    OpenLearningImage,
    ResearchCorpus,
    SourceEvidence,
    StoryGenerationRequest,
)
from ..errors import ConfigurationError, ProviderError
from .http import request_with_retries


class ExaClient:
    _LICENSES = (
        (
            re.compile(r"\bpublic domain\b", re.IGNORECASE),
            "Public domain",
            "https://creativecommons.org/publicdomain/mark/1.0/",
        ),
        (
            re.compile(r"\bCC0(?:\s+1\.0)?\b", re.IGNORECASE),
            "CC0 1.0",
            "https://creativecommons.org/publicdomain/zero/1.0/",
        ),
        (
            re.compile(r"\bCC BY-SA 4\.0\b", re.IGNORECASE),
            "CC BY-SA 4.0",
            "https://creativecommons.org/licenses/by-sa/4.0/",
        ),
        (
            re.compile(r"\bCC BY 4\.0\b", re.IGNORECASE),
            "CC BY 4.0",
            "https://creativecommons.org/licenses/by/4.0/",
        ),
        (
            re.compile(r"\bCC BY-SA 3\.0\b", re.IGNORECASE),
            "CC BY-SA 3.0",
            "https://creativecommons.org/licenses/by-sa/3.0/",
        ),
        (
            re.compile(r"\bCC BY 3\.0\b", re.IGNORECASE),
            "CC BY 3.0",
            "https://creativecommons.org/licenses/by/3.0/",
        ),
    )

    def __init__(
        self,
        settings: PipelineSettings,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._settings = settings
        self._http = http_client or httpx.AsyncClient(
            timeout=settings.request_timeout_seconds
        )
        self._owns_http = http_client is None

    async def close(self) -> None:
        if self._owns_http:
            await self._http.aclose()

    async def research_topics(
        self, request: StoryGenerationRequest
    ) -> ResearchCorpus:
        if not self._settings.exa_api_key:
            raise ConfigurationError("EXA_API_KEY is required")

        subject_hint = (
            ", ".join(
                (
                    f"{item.domain}/{item.discipline}"
                    + (
                        f" focused on {', '.join(item.topic_tags)}"
                        if item.topic_tags
                        else ""
                    )
                )
                for item in request.preferred_subjects
            )
            or "a broad mix of academic subjects"
        )
        excluded = ", ".join(request.excluded_topics) or "none"
        query = (
            "Recent, factual, surprising developments or overlooked real-world "
            f"phenomena that provide a simple hook for teaching one foundational "
            f"concept to age {request.target_age}. Prefer clear everyday cause and "
            f"effect over specialist research details. Focus tightly on "
            f"{subject_hint}; do not drift to unrelated disciplines. Exclude: "
            f"{excluded}."
        )
        response = await request_with_retries(
            self._http,
            "POST",
            f"{self._settings.exa_base_url.rstrip('/')}/search",
            headers={
                "x-api-key": self._settings.exa_api_key,
                "content-type": "application/json",
            },
            json={
                "query": query,
                "type": DEFAULT_EXA_SEARCH_TYPE,
                "numResults": DEFAULT_EXA_RESULT_COUNT,
                "contents": {
                    "highlights": {"maxCharacters": 1200},
                    "text": {"maxCharacters": 2000},
                },
            },
        )
        if response.status_code >= 400:
            raise ProviderError(
                f"Exa search returned status {response.status_code}"
            )

        payload = response.json()
        results = payload.get("results")
        if not isinstance(results, list):
            raise ProviderError("Exa search response did not contain results")

        sources = [
            source
            for item in results
            if (source := self._parse_source(item)) is not None
        ]
        if len(sources) < 3:
            raise ProviderError("Exa returned fewer than three usable sources")
        reference_images = await self._research_reference_images(
            subject_hint, request.target_age
        )
        return ResearchCorpus(
            query=query,
            sources=sources,
            reference_images=reference_images,
        )

    async def _research_reference_images(
        self, subject_hint: str, target_age: int
    ) -> list[OpenLearningImage]:
        queries = [
            (
                "Clear educational diagrams or documentary photographs that help "
                f"explain {subject_hint} to age {target_age}."
            ),
            (
                "Simple educational diagrams or documentary photographs explaining "
                f"the foundational mechanisms behind {subject_hint}, with a different "
                "visual perspective from the first result."
            ),
            (
                "A clear real-world photograph, scientific diagram, or process "
                f"illustration that makes one important part of {subject_hint} visible."
            ),
        ]
        references: list[OpenLearningImage] = []
        for query in queries:
            response = await request_with_retries(
                self._http,
                "POST",
                f"{self._settings.exa_base_url.rstrip('/')}/search",
                headers={
                    "x-api-key": self._settings.exa_api_key,
                    "content-type": "application/json",
                },
                json={
                    "query": (
                        f"{query} Use only Wikimedia Commons file pages that "
                        "explicitly state Public domain, CC0, CC BY, or CC BY-SA. "
                        "Prefer simple visuals with one teachable idea."
                    ),
                    "type": DEFAULT_EXA_SEARCH_TYPE,
                    "numResults": 10,
                    "includeDomains": ["commons.wikimedia.org"],
                    "contents": {
                        "text": {"maxCharacters": 3000},
                        "extras": {"imageLinks": 3},
                    },
                },
            )
            if response.status_code >= 400:
                raise ProviderError(
                    f"Exa reference-image search returned status {response.status_code}"
                )
            results = response.json().get("results")
            if not isinstance(results, list):
                raise ProviderError(
                    "Exa reference-image search did not contain results"
                )
            references.extend(
                reference
                for item in results
                if (reference := self._parse_reference_image(item)) is not None
            )
            if len({str(item.image_url) for item in references}) >= 3:
                break
        deduplicated = {
            str(reference.image_url): reference for reference in references
        }
        selected = []
        for reference in deduplicated.values():
            if await self._image_is_reachable(str(reference.image_url)):
                selected.append(reference)
            if len(selected) >= 3:
                break
        if len(selected) < 2:
            raise ProviderError(
                "Exa returned fewer than two reachable licensed learning images"
            )
        return selected

    async def _image_is_reachable(self, url: str) -> bool:
        headers = {
            "user-agent": "Artham/1.0 (educational reference image validation)"
        }
        try:
            response = await self._http.head(
                url,
                headers=headers,
                timeout=10.0,
                follow_redirects=True,
            )
            content_type = response.headers.get("content-type", "")
            if response.status_code < 400 and content_type.startswith("image/"):
                return True
            async with self._http.stream(
                "GET",
                url,
                headers={**headers, "range": "bytes=0-1023"},
                timeout=10.0,
                follow_redirects=True,
            ) as fallback:
                content_type = fallback.headers.get("content-type", "")
                return (
                    fallback.status_code < 400
                    and content_type.startswith("image/")
                )
        except httpx.HTTPError:
            return False

    @classmethod
    def _parse_reference_image(
        cls, item: Any
    ) -> OpenLearningImage | None:
        if not isinstance(item, dict):
            return None
        title = item.get("title")
        page_url = item.get("url")
        text = item.get("text")
        if not all(isinstance(value, str) for value in (title, page_url, text)):
            return None
        if "commons.wikimedia.org" not in page_url:
            return None
        license_details = next(
            (
                (name, license_url)
                for pattern, name, license_url in cls._LICENSES
                if pattern.search(text)
            ),
            None,
        )
        if license_details is None:
            return None
        image_url = item.get("image")
        extras = item.get("extras")
        if not isinstance(image_url, str) and isinstance(extras, dict):
            links = extras.get("imageLinks")
            if isinstance(links, list):
                image_url = next(
                    (link for link in links if isinstance(link, str)),
                    None,
                )
        if not isinstance(image_url, str) or not image_url.startswith("https://"):
            return None
        source_name = item.get("author")
        if not isinstance(source_name, str) or len(source_name.strip()) < 2:
            source_name = "Wikimedia Commons contributor"
        license_name, license_url = license_details
        clean_title = re.sub(r"^\s*File\s*:\s*", "", title).strip()
        clean_title = re.sub(
            r"\.(?:svg|png|jpe?g|webp|gif|pdf)\b",
            "",
            clean_title,
            flags=re.IGNORECASE,
        )
        clean_title = re.sub(r"[_\s]+", " ", clean_title).strip()
        return OpenLearningImage(
            title=clean_title,
            image_url=image_url,
            source_page_url=page_url,
            source_name=source_name,
            license_name=license_name,
            license_url=license_url,
            alt_text=f"Reference image: {clean_title}",
        )

    @staticmethod
    def _parse_source(item: Any) -> SourceEvidence | None:
        if not isinstance(item, dict):
            return None
        title = item.get("title")
        url = item.get("url")
        if not isinstance(title, str) or not isinstance(url, str):
            return None

        highlights = item.get("highlights")
        excerpt = ""
        if isinstance(highlights, list):
            excerpt = " ".join(
                value for value in highlights if isinstance(value, str)
            )
        if not excerpt and isinstance(item.get("text"), str):
            excerpt = item["text"]
        excerpt = " ".join(excerpt.split())[:1200]
        if len(excerpt) < 20:
            return None

        published_at = None
        raw_date = item.get("publishedDate")
        if isinstance(raw_date, str):
            try:
                published_at = datetime.fromisoformat(
                    raw_date.replace("Z", "+00:00")
                )
            except ValueError:
                published_at = None

        return SourceEvidence(
            title=title,
            url=url,
            published_at=published_at,
            excerpt=excerpt,
            source_name=item.get("author")
            if isinstance(item.get("author"), str)
            else None,
        )
