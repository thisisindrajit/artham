from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from functools import lru_cache
from typing import Protocol

import google.auth
from anyio import to_thread
from google.api_core.exceptions import GoogleAPIError, NotFound
from google.auth.credentials import Credentials, Signing
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request
from google.cloud import storage
from google.cloud.storage.bucket import Bucket

from app.core.config import get_settings
from app.core.exceptions import APIError

GCS_SCOPE = "https://www.googleapis.com/auth/devstorage.read_write"


@dataclass(frozen=True)
class ObjectMetadata:
    content_type: str
    byte_size: int
    sha256: str | None


class ObjectStorage(Protocol):
    async def create_signed_put(
        self,
        *,
        storage_key: str,
        content_type: str,
        byte_size: int,
        sha256: str,
        expires_in: int,
    ) -> tuple[str, dict[str, str]]: ...

    async def create_signed_get(
        self, *, storage_key: str, expires_in: int
    ) -> str: ...

    async def download(self, storage_key: str) -> bytes: ...

    async def inspect(self, storage_key: str) -> ObjectMetadata: ...


class GCSObjectStorage:
    def __init__(
        self,
        bucket: Bucket,
        credentials: Credentials,
        signing_service_account: str | None = None,
    ) -> None:
        self._bucket = bucket
        self._credentials = credentials
        self._signing_service_account = signing_service_account

    async def create_signed_put(
        self,
        *,
        storage_key: str,
        content_type: str,
        byte_size: int,
        sha256: str,
        expires_in: int,
    ) -> tuple[str, dict[str, str]]:
        headers = {
            "content-length": str(byte_size),
            "x-goog-content-length-range": f"{byte_size},{byte_size}",
            "x-goog-meta-sha256": sha256,
        }
        blob = self._bucket.blob(storage_key)

        try:
            url = await to_thread.run_sync(
                lambda: self._generate_signed_url(
                    blob=blob,
                    method="PUT",
                    content_type=content_type,
                    headers=headers.copy(),
                    expires_in=expires_in,
                )
            )
        except (GoogleAPIError, GoogleAuthError, AttributeError, ValueError) as exc:
            raise APIError(
                status_code=503,
                code="OBJECT_STORAGE_UNAVAILABLE",
                message="Google Cloud Storage could not create an upload URL.",
                retryable=True,
            ) from exc

        return url, {"content-type": content_type, **headers}

    async def inspect(self, storage_key: str) -> ObjectMetadata:
        blob = self._bucket.blob(storage_key)
        try:
            await to_thread.run_sync(blob.reload)
        except NotFound as exc:
            raise APIError(
                status_code=422,
                code="ASSET_NOT_UPLOADED",
                message="A referenced asset has not been uploaded.",
            ) from exc
        except (GoogleAPIError, GoogleAuthError) as exc:
            raise APIError(
                status_code=503,
                code="OBJECT_STORAGE_UNAVAILABLE",
                message="Google Cloud Storage could not verify an uploaded asset.",
                retryable=True,
            ) from exc

        return ObjectMetadata(
            content_type=blob.content_type or "",
            byte_size=blob.size or 0,
            sha256=(blob.metadata or {}).get("sha256"),
        )

    async def create_signed_get(self, *, storage_key: str, expires_in: int) -> str:
        blob = self._bucket.blob(storage_key)
        try:
            return await to_thread.run_sync(
                lambda: self._generate_signed_url(
                    blob=blob,
                    method="GET",
                    expires_in=expires_in,
                )
            )
        except (GoogleAPIError, GoogleAuthError, AttributeError, ValueError) as exc:
            raise APIError(
                status_code=503,
                code="OBJECT_STORAGE_UNAVAILABLE",
                message="Google Cloud Storage could not create a media URL.",
                retryable=True,
            ) from exc

    async def download(self, storage_key: str) -> bytes:
        blob = self._bucket.blob(storage_key)
        try:
            return await to_thread.run_sync(blob.download_as_bytes)
        except NotFound as exc:
            raise APIError(
                status_code=404,
                code="ASSET_NOT_UPLOADED",
                message="The requested media asset does not exist.",
            ) from exc
        except (GoogleAPIError, GoogleAuthError) as exc:
            raise APIError(
                status_code=503,
                code="OBJECT_STORAGE_UNAVAILABLE",
                message="Google Cloud Storage could not read the media asset.",
                retryable=True,
            ) from exc

    def _generate_signed_url(
        self,
        *,
        blob: storage.Blob,
        method: str,
        expires_in: int,
        content_type: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> str:
        signing_args: dict[str, object] = {"credentials": self._credentials}
        if not isinstance(self._credentials, Signing):
            if not self._signing_service_account:
                raise ValueError(
                    "GCS signing requires signing credentials or a signing service account"
                )
            if not self._credentials.valid:
                self._credentials.refresh(Request())
            signing_args.update(
                access_token=self._credentials.token,
                service_account_email=self._signing_service_account,
            )

        return blob.generate_signed_url(
            version="v4",
            expiration=timedelta(seconds=expires_in),
            method=method,
            content_type=content_type,
            headers=headers,
            **signing_args,
        )


@lru_cache
def get_object_storage() -> ObjectStorage:
    settings = get_settings()
    if not settings.gcs_bucket:
        raise APIError(
            status_code=503,
            code="OBJECT_STORAGE_NOT_CONFIGURED",
            message="Google Cloud Storage is not configured.",
            retryable=False,
        )

    try:
        credentials, discovered_project = google.auth.default(scopes=[GCS_SCOPE])
        client = storage.Client(
            project=settings.gcp_project or discovered_project,
            credentials=credentials,
        )
    except GoogleAuthError as exc:
        raise APIError(
            status_code=503,
            code="OBJECT_STORAGE_NOT_CONFIGURED",
            message="Google Cloud application credentials are unavailable.",
            retryable=False,
        ) from exc

    return GCSObjectStorage(
        bucket=client.bucket(settings.gcs_bucket),
        credentials=credentials,
        signing_service_account=settings.gcs_signing_service_account,
    )
