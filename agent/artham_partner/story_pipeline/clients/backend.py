"""Client for the future backend persistence and media-upload contracts."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from urllib.parse import quote

import httpx

from ..config import PipelineSettings
from ..contracts import (
    AssetKind,
    AssetReference,
    BackendStoryWrite,
    EngagementProfile,
    PersistenceReceipt,
    SignedUpload,
    UploadIntent,
)
from ..errors import BackendError, ConfigurationError
from .http import request_with_retries
from .vertex import GeneratedBinary


class BackendClient:
    def __init__(
        self,
        settings: PipelineSettings,
        http_client: httpx.AsyncClient | None = None,
        upload_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._settings = settings
        self._http = http_client or httpx.AsyncClient(
            # Upload-intent signing can refresh cloud credentials and take longer
            # than ordinary local API calls.
            timeout=max(
                settings.request_timeout_seconds,
                settings.media_timeout_seconds,
            )
        )
        self._uploads = upload_client or httpx.AsyncClient(
            timeout=settings.media_timeout_seconds
        )
        self._owns_http = http_client is None
        self._owns_uploads = upload_client is None

    async def close(self) -> None:
        if self._owns_http:
            await self._http.aclose()
        if self._owns_uploads:
            await self._uploads.aclose()

    async def get_engagement(self, learner_id: str) -> EngagementProfile:
        encoded_learner_id = quote(learner_id, safe="")
        response = await request_with_retries(
            self._http,
            "GET",
            self._url(
                f"/v1/internal/learners/{encoded_learner_id}/story-engagement"
            ),
            headers=self._headers(),
        )
        if response.status_code == 404:
            return EngagementProfile(
                learner_id=learner_id,
                stories=[],
                generated_at=datetime.now(UTC),
            )
        if response.status_code >= 400:
            raise BackendError(
                "Backend engagement request returned status "
                f"{response.status_code}: {response.text[:500]}"
            )
        return EngagementProfile.model_validate(response.json())

    async def upload_asset(
        self,
        *,
        job_id: str,
        asset_key: str,
        kind: AssetKind,
        generated: GeneratedBinary,
        scene_id: str | None = None,
        alt_text: str | None = None,
    ) -> AssetReference:
        digest = hashlib.sha256(generated.data).hexdigest()
        intent = UploadIntent(
            job_id=job_id,
            asset_key=asset_key,
            kind=kind,
            content_type=generated.content_type,
            byte_size=len(generated.data),
            sha256=digest,
        )
        response = await request_with_retries(
            self._http,
            "POST",
            self._url("/v1/internal/media/upload-intents"),
            headers=self._headers(),
            json=intent.model_dump(mode="json"),
        )
        if response.status_code >= 400:
            raise BackendError(
                "Backend upload-intent request returned status "
                f"{response.status_code}: {response.text[:500]}"
            )
        signed = SignedUpload.model_validate(response.json())
        upload_response = await request_with_retries(
            self._uploads,
            "PUT",
            str(signed.upload_url),
            headers=signed.headers,
            content=generated.data,
        )
        if upload_response.status_code >= 400:
            raise BackendError(
                f"Signed upload returned status {upload_response.status_code}"
            )

        return AssetReference(
            asset_id=signed.asset_id,
            asset_key=asset_key,
            kind=kind,
            url=signed.public_url,
            content_type=generated.content_type,
            byte_size=len(generated.data),
            sha256=digest,
            scene_id=scene_id,
            alt_text=alt_text,
            duration_seconds=generated.duration_seconds,
            provider_model=generated.provider_model,
        )

    async def persist_story(
        self, write: BackendStoryWrite
    ) -> PersistenceReceipt:
        response = await request_with_retries(
            self._http,
            "POST",
            self._url("/v1/internal/generated-stories"),
            headers={
                **self._headers(),
                "idempotency-key": write.idempotency_key,
            },
            json=write.model_dump(mode="json"),
        )
        if response.status_code >= 400:
            raise BackendError(
                "Backend story persistence returned status "
                f"{response.status_code}: {response.text[:500]}"
            )
        return PersistenceReceipt.model_validate(response.json())

    def _url(self, path: str) -> str:
        if not self._settings.backend_base_url:
            raise ConfigurationError("ARTHAM_BACKEND_BASE_URL is required")
        return f"{self._settings.backend_base_url.rstrip('/')}{path}"

    def _headers(self) -> dict[str, str]:
        if not self._settings.backend_api_key:
            raise ConfigurationError("ARTHAM_BACKEND_API_KEY is required")
        return {
            "authorization": f"Bearer {self._settings.backend_api_key}",
            "content-type": "application/json",
        }
