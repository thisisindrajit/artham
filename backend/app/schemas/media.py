from datetime import datetime

from pydantic import Field, HttpUrl, model_validator

from app.schemas.base import ContractModel
from app.schemas.story import ALLOWED_MIME_TYPES, AssetKind


class UploadIntent(ContractModel):
    job_id: str = Field(min_length=1, max_length=128)
    asset_key: str = Field(min_length=1, max_length=128)
    kind: AssetKind
    content_type: str
    byte_size: int = Field(gt=0)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")

    @model_validator(mode="after")
    def mime_type_matches_kind(self) -> "UploadIntent":
        if self.content_type not in ALLOWED_MIME_TYPES[self.kind]:
            raise ValueError(f"{self.content_type} is not valid for {self.kind}")
        return self


class SignedUpload(ContractModel):
    asset_id: str
    upload_url: HttpUrl
    public_url: HttpUrl
    headers: dict[str, str] = Field(default_factory=dict)
    expires_at: datetime


class JobMediaCleanupResult(ContractModel):
    job_id: str
    deleted_assets: int = Field(ge=0)
    skipped_committed_assets: int = Field(ge=0)
