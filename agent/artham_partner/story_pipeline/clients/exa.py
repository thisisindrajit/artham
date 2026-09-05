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
    _SUBJECT_STOPWORDS = frozenset(
        {"a", "an", "and", "of", "the", "for", "in", "on", "with", "display"}
    )
    _NON_ENGLISH_MARKERS = re.compile(
        r"[^\x00-\x7f]|\b(?:français|deutsch|español|polski|polnisch|"
        r"schemat|działania|kamera|obraz|sterowanie|matryca)\b",
        re.IGNORECASE,
    )
    # Commons file pages state the license as a linked badge whose alt text is
    # "attribution"/"share alike" rather than a literal string like
    # "CC BY-SA 4.0", so matching license prose alone discards almost every
    # genuinely open image. The canonical creativecommons.org URL is the
    # machine-readable signal that is always present, so match that first and
    # keep the prose patterns as a fallback for pages that only spell it out.
    _LICENSE_URL = re.compile(
        r"creativecommons\.org/(licenses|publicdomain)/([a-z0-9\-]+)/(\d(?:\.\d)?)",
        re.IGNORECASE,
    )
    _PUBLIC_DOMAIN_TEXT = re.compile(
        r"\b(public domain|PD-self|PD-old|PD-US)\b", re.IGNORECASE
    )
    _ALLOWED_LICENSE_CODES = frozenset(
        {"by", "by-sa", "zero", "mark", "certification"}
    )

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

    @classmethod
    def _detect_license(cls, text: str) -> tuple[str, str] | None:
        """Return the (name, url) of the most permissive open license the page
        declares, or None when it declares nothing usable."""
        for match in cls._LICENSE_URL.finditer(text):
            kind, code, version = (
                match.group(1).lower(),
                match.group(2).lower(),
                match.group(3),
            )
            if code not in cls._ALLOWED_LICENSE_CODES:
                continue
            url = f"https://creativecommons.org/{kind}/{code}/{version}/"
            if kind == "publicdomain":
                name = "CC0 1.0" if code == "zero" else "Public domain"
            else:
                name = f"CC {code.upper()} {version}"
            return name, url
        if cls._PUBLIC_DOMAIN_TEXT.search(text):
            return (
                "Public domain",
                "https://creativecommons.org/publicdomain/mark/1.0/",
            )
        return next(
            (
                (name, license_url)
                for pattern, name, license_url in cls._LICENSES
                if pattern.search(text)
            ),
            None,
        )

    # Wikimedia file titles append noisy institution names and catalog codes
    # after the descriptive part, e.g. "Artist - Scene, date - P1718 - Musée
    # Carnavalet - Wikimedia Commons" or "Scene MET DP820481 - Wikimedia
    # Commons". Strip those trailing segments so the remaining text is a
    # natural phrase a learner can read and, if needed, use directly as a
    # fallback explanation of what the image depicts.
    _INSTITUTION_SEGMENT = re.compile(
        r"wikimedia commons|musée|museum|gallery|library|archives?|collection",
        re.IGNORECASE,
    )
    _CATALOG_SEGMENT = re.compile(r"^[A-Za-z]{0,4}\s?\d[\dA-Za-z]*$")
    _TRAILING_CODE_TOKEN = re.compile(r"^[A-Z0-9]{2,}$")

    @classmethod
    def _naturalize_title(cls, raw_title: str) -> str:
        segments = [part.strip() for part in raw_title.split(" - ") if part.strip()]
        kept = [
            segment
            for segment in segments
            if not cls._INSTITUTION_SEGMENT.search(segment)
            and not cls._CATALOG_SEGMENT.match(segment)
        ]
        if not kept:
            kept = segments[:1] if segments else [raw_title]
        text = ", ".join(kept)
        words = text.split()
        while len(words) > 4 and cls._TRAILING_CODE_TOKEN.match(words[-1]):
            words.pop()
        cleaned = " ".join(words).strip().rstrip(",").strip()
        if len(cleaned) >= 12:
            return cleaned
        # Filtering removed too much (e.g. the file's only segment was a bare
        # catalog code like "PICT0111"). Fall back to a still-natural phrase
        # that meets the learner-facing minimum length rather than a cryptic
        # code fragment.
        base = cleaned or (" ".join(segments) if segments else raw_title).strip()
        return f"Wikimedia Commons image: {base}"[:160].strip()

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
        brief_clause = (
            f" The requested story concept is: {request.story_brief}. Find "
            "evidence that would ground this exact concept, not just the "
            "general subject area."
            if request.story_brief
            else ""
        )
        query = (
            "Authoritative beginner explanations and concrete real-world examples "
            f"that provide a simple hook for teaching one foundational "
            f"concept to age {request.target_age}. Prefer clear everyday cause and "
            f"effect over specialist research details. Focus tightly on "
            f"{subject_hint}; do not drift to unrelated disciplines. Exclude: "
            f"{excluded}.{brief_clause}"
            " Include source explanations of what each necessary thing is, what it "
            "does, and why the basic cause produces the effect. Assume zero prior "
            "topic knowledge. Prefer educational institutions, museums, and primary "
            "explainers over technical discovery reports that omit prerequisites."
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
        return ResearchCorpus(
            query=query,
            sources=sources,
        )

    async def find_reference_image(self, subject: str) -> OpenLearningImage | None:
        """Find one real, openly licensed photo/diagram of a specific,
        concrete, named subject (e.g. "pyrrole molecule structure", "Federal
        Reserve building") that a scene's narrative actually mentions.

        Unlike the old topic-level search, this is deliberately narrow: it
        looks for exactly the named thing a scene wrote about, not a generic
        illustrative example of the story's broader subject. Returns None
        when no reachable, openly licensed result is found rather than
        raising, so one missing image never blocks story generation.
        """
        query = (
            f"An English-language real, accurate photograph or clear diagram of "
            f"the exact subject {subject}. The image must be directly relevant, "
            "not a generic illustration, and must contain no non-English writing."
        )
        try:
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
                    "numResults": 8,
                    "includeDomains": ["commons.wikimedia.org"],
                    "contents": {
                        # The Licensing section sits far down a Commons file
                        # page, so a small window truncates the only proof the
                        # image is openly licensed.
                        "text": {"maxCharacters": 20000},
                        "extras": {"imageLinks": 3},
                    },
                },
            )
        except httpx.HTTPError:
            return None
        if response.status_code >= 400:
            return None
        results = response.json().get("results")
        if not isinstance(results, list):
            return None
        candidates = [
            reference
            for item in results
            if self._subject_matches(item, subject)
            and (reference := self._parse_reference_image(item)) is not None
        ]
        for candidate in candidates:
            if await self._image_is_reachable(str(candidate.image_url)):
                return candidate
        return None

    @classmethod
    def _subject_matches(cls, item: Any, subject: str) -> bool:
        if not isinstance(item, dict):
            return False
        haystack = " ".join(
            str(item.get(key) or "") for key in ("title", "text")
        ).lower()
        tokens = {
            token
            for token in re.findall(r"[a-z0-9]+", subject.lower())
            if len(token) >= 4 and token not in cls._SUBJECT_STOPWORDS
        }
        return bool(tokens and any(token in haystack for token in tokens))

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
        license_details = cls._detect_license(text)
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
        clean_title = cls._naturalize_title(clean_title)
        summary = cls._extract_page_summary(text)
        if cls._NON_ENGLISH_MARKERS.search(clean_title) or (
            summary and cls._NON_ENGLISH_MARKERS.search(summary)
        ):
            return None
        return OpenLearningImage(
            title=clean_title,
            image_url=image_url,
            source_page_url=page_url,
            source_name=source_name,
            license_name=license_name,
            license_url=license_url,
            alt_text=clean_title,
            page_summary=summary,
        )

    # Wikimedia file-page text mixes a real English description with license
    # boilerplate ("You are free:", "Permission", category listings, etc). Pull
    # out the descriptive sentences so a real explanation of the image content
    # is available even when no author agent ends up authoring one.
    _BOILERPLATE_LINE = re.compile(
        r"^\s*(this file is licensed|you are free|permission|licensing|"
        r"attribution|this (?:work|image) (?:has been|is) (?:released|dedicated)|"
        r"summary|description|source|author|date taken|w:en:|"
        r"the copyright holder|category:|this is a file from|"
        r"english[:\s]|français|deutsch|español)",
        re.IGNORECASE,
    )

    @classmethod
    def _extract_page_summary(cls, text: str) -> str | None:
        candidate_sentences: list[str] = []
        for line in text.splitlines():
            stripped = line.strip().strip("|=").strip()
            if not stripped or cls._BOILERPLATE_LINE.search(stripped):
                continue
            if len(stripped) < 25:
                continue
            candidate_sentences.append(stripped)
            if sum(len(item) for item in candidate_sentences) >= 400:
                break
        if not candidate_sentences:
            return None
        summary = " ".join(candidate_sentences)
        summary = re.sub(r"\s+", " ", summary).strip()
        return summary[:600] if summary else None

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
