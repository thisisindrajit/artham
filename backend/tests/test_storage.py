from typing import Any

import pytest
from google.api_core.exceptions import NotFound
from google.auth.credentials import Credentials, Signing

from app.core.exceptions import APIError
from app.services.storage import GCSObjectStorage


class FakeSigningCredentials(Credentials, Signing):
    @property
    def signer(self) -> Any:
        return None

    @property
    def signer_email(self) -> str:
        return "signer@example.test"

    def sign_bytes(self, message: bytes) -> bytes:
        return b"signed"

    def refresh(self, request: Any) -> None:
        self.token = "token"


class FakeRuntimeCredentials(Credentials):
    def __init__(self) -> None:
        super().__init__()
        self.refresh_count = 0

    def refresh(self, request: Any) -> None:
        self.refresh_count += 1
        self.token = "runtime-token"


class FakeBlob:
    def __init__(self, *, reload_error: Exception | None = None) -> None:
        self.reload_error = reload_error
        self.content_type = "image/webp"
        self.size = 42
        self.metadata = {"sha256": "a" * 64}
        self.signed_url_arguments: dict[str, Any] | None = None

    def generate_signed_url(self, **kwargs: Any) -> str:
        self.signed_url_arguments = kwargs
        if content_type := kwargs.get("content_type"):
            kwargs["headers"]["Content-Type"] = content_type
        return "https://storage.googleapis.test/upload"

    def reload(self) -> None:
        if self.reload_error:
            raise self.reload_error

    def download_as_bytes(self) -> bytes:
        return b"media"


class FakeBucket:
    def __init__(self, blob: FakeBlob) -> None:
        self.blob_instance = blob
        self.requested_key: str | None = None

    def blob(self, storage_key: str) -> FakeBlob:
        self.requested_key = storage_key
        return self.blob_instance


@pytest.mark.anyio
async def test_creates_gcs_v4_signed_put_with_bound_metadata() -> None:
    blob = FakeBlob()
    bucket = FakeBucket(blob)
    storage = GCSObjectStorage(bucket, FakeSigningCredentials())

    url, headers = await storage.create_signed_put(
        storage_key="production/jobs/job/asset.webp",
        content_type="image/webp",
        byte_size=42,
        sha256="a" * 64,
        expires_in=600,
    )

    assert url == "https://storage.googleapis.test/upload"
    assert bucket.requested_key == "production/jobs/job/asset.webp"
    assert headers == {
        "content-type": "image/webp",
        "content-length": "42",
        "x-goog-content-length-range": "42,42",
        "x-goog-meta-sha256": "a" * 64,
    }
    assert blob.signed_url_arguments is not None
    assert blob.signed_url_arguments["version"] == "v4"
    assert blob.signed_url_arguments["method"] == "PUT"
    assert blob.signed_url_arguments["content_type"] == "image/webp"


@pytest.mark.anyio
async def test_reads_gcs_object_metadata_for_persistence_validation() -> None:
    storage = GCSObjectStorage(FakeBucket(FakeBlob()), FakeSigningCredentials())

    metadata = await storage.inspect("production/jobs/job/asset.webp")

    assert metadata.content_type == "image/webp"
    assert metadata.byte_size == 42
    assert metadata.sha256 == "a" * 64


@pytest.mark.anyio
async def test_creates_gcs_v4_signed_get_for_private_media() -> None:
    blob = FakeBlob()
    storage = GCSObjectStorage(FakeBucket(blob), FakeSigningCredentials())

    url = await storage.create_signed_get(
        storage_key="production/jobs/job/asset.webp",
        expires_in=600,
    )

    assert url == "https://storage.googleapis.test/upload"
    assert blob.signed_url_arguments is not None
    assert blob.signed_url_arguments["method"] == "GET"
    assert blob.signed_url_arguments["content_type"] is None
    assert blob.signed_url_arguments["headers"] is None


@pytest.mark.anyio
async def test_downloads_private_media() -> None:
    storage = GCSObjectStorage(FakeBucket(FakeBlob()), FakeSigningCredentials())

    assert await storage.download("production/jobs/job/asset.webp") == b"media"


@pytest.mark.anyio
async def test_uses_iam_sign_blob_for_runtime_credentials() -> None:
    blob = FakeBlob()
    credentials = FakeRuntimeCredentials()
    storage = GCSObjectStorage(
        FakeBucket(blob),
        credentials,
        signing_service_account="backend@example.test",
    )

    await storage.create_signed_put(
        storage_key="production/jobs/job/asset.webp",
        content_type="image/webp",
        byte_size=42,
        sha256="a" * 64,
        expires_in=600,
    )

    assert credentials.refresh_count == 1
    assert blob.signed_url_arguments is not None
    assert blob.signed_url_arguments["access_token"] == "runtime-token"
    assert blob.signed_url_arguments["service_account_email"] == "backend@example.test"


@pytest.mark.anyio
async def test_missing_gcs_object_returns_contract_error() -> None:
    storage = GCSObjectStorage(
        FakeBucket(FakeBlob(reload_error=NotFound("missing"))),
        FakeSigningCredentials(),
    )

    with pytest.raises(APIError) as error:
        await storage.inspect("production/jobs/job/missing.webp")

    assert error.value.status_code == 422
    assert error.value.code == "ASSET_NOT_UPLOADED"
