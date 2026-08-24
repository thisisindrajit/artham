from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Artham API"
    app_version: str = "0.1.0"
    environment: Literal["local", "development", "staging", "production"] = "local"
    debug: bool = False
    docs_enabled: bool = True
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    database_url: str = "sqlite+aiosqlite:///./artham.db"
    database_ssl: bool = True
    internal_api_key: SecretStr = SecretStr("local-development-only")
    max_request_bytes: int = Field(default=10 * 1024 * 1024, ge=1024)
    upload_url_ttl_seconds: int = Field(default=600, ge=300, le=900)
    max_image_upload_bytes: int = Field(default=25 * 1024 * 1024, ge=1)
    max_video_upload_bytes: int = Field(default=250 * 1024 * 1024, ge=1)
    max_audio_upload_bytes: int = Field(default=50 * 1024 * 1024, ge=1)
    media_scan_required: bool = False
    embedding_dimensions: int = Field(default=768, ge=1)
    gcp_project: str | None = None
    gcs_bucket: str | None = None
    gcs_signing_service_account: str | None = None
    cdn_base_url: str | None = None

    @model_validator(mode="after")
    def production_configuration_is_safe(self) -> "Settings":
        if self.environment == "production":
            if not self.database_url.startswith("postgresql+asyncpg://"):
                raise ValueError("production requires a PostgreSQL async database URL")
            if not self.database_ssl:
                raise ValueError("production requires TLS database connections")
            if self.internal_api_key.get_secret_value() == "local-development-only":
                raise ValueError("production requires a unique internal API key")
            if not self.gcp_project or not self.gcs_bucket:
                raise ValueError("production requires a GCP project and GCS bucket")
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="ARTHAM_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
