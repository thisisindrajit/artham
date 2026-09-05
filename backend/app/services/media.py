from datetime import UTC, datetime, timedelta
from pathlib import PurePosixPath
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.exceptions import APIError
from app.db.models import MediaAsset
from app.schemas.media import JobMediaCleanupResult, SignedUpload, UploadIntent
from app.services.hashing import canonical_hash
from app.services.locks import advisory_transaction_lock
from app.services.storage import ObjectStorage

CONTENT_EXTENSIONS = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "audio/wav": ".wav",
    "audio/mpeg": ".mp3",
}


async def create_upload_intent(
    *,
    session: AsyncSession,
    storage: ObjectStorage,
    settings: Settings,
    intent: UploadIntent,
) -> SignedUpload:
    size_limits = {
        "image": settings.max_image_upload_bytes,
        "video": settings.max_video_upload_bytes,
        "audio": settings.max_audio_upload_bytes,
    }
    if intent.byte_size > size_limits[intent.kind.value]:
        raise APIError(
            status_code=413,
            code="ASSET_TOO_LARGE",
            message=f"The declared {intent.kind.value} exceeds its upload size limit.",
        )

    intent_hash = canonical_hash(intent.model_dump(mode="json"))
    async with session.begin():
        await advisory_transaction_lock(session, f"upload:{intent.job_id}:{intent.asset_key}")
        asset = await session.scalar(
            select(MediaAsset)
            .where(
                MediaAsset.job_id == intent.job_id,
                MediaAsset.asset_key == intent.asset_key,
            )
            .with_for_update()
        )
        if asset is not None and asset.request_hash != intent_hash:
            raise APIError(
                status_code=409,
                code="UPLOAD_INTENT_CONFLICT",
                message="This job and asset key were already used for different content.",
            )
        if asset is not None and asset.commit_state == "committed":
            raise APIError(
                status_code=409,
                code="ASSET_ALREADY_COMMITTED",
                message="The requested asset has already been committed to a story.",
            )

        now = datetime.now(UTC)
        if asset is None:
            asset_id = f"asset_{uuid4().hex}"
            job_scope = canonical_hash(intent.job_id)[:24]
            storage_key = str(
                PurePosixPath(
                    job_scope,
                    f"{asset_id}{CONTENT_EXTENSIONS[intent.content_type]}",
                )
            )
            base_url = settings.cdn_base_url or (
                f"https://storage.googleapis.com/{settings.gcs_bucket}"
                if settings.gcs_bucket
                else "https://storage.googleapis.com"
            )
            public_url = f"{base_url.rstrip('/')}/{storage_key}"
            asset = MediaAsset(
                id=asset_id,
                job_id=intent.job_id,
                asset_key=intent.asset_key,
                request_hash=intent_hash,
                storage_key=storage_key,
                kind=intent.kind.value,
                content_type=intent.content_type,
                byte_size=intent.byte_size,
                sha256=intent.sha256,
                scan_state="pending",
                commit_state="uncommitted",
                cdn_url=public_url,
                expires_at=now + timedelta(hours=24),
            )
            session.add(asset)

        upload_url, headers = await storage.create_signed_put(
            storage_key=asset.storage_key,
            content_type=asset.content_type,
            byte_size=asset.byte_size,
            sha256=asset.sha256,
            expires_in=settings.upload_url_ttl_seconds,
        )

    return SignedUpload(
        asset_id=asset.id,
        upload_url=upload_url,
        public_url=asset.cdn_url,
        headers=headers,
        expires_at=now + timedelta(seconds=settings.upload_url_ttl_seconds),
    )


async def delete_job_media(
    *,
    session: AsyncSession,
    storage: ObjectStorage,
    job_id: str,
) -> JobMediaCleanupResult:
    """Delete every uncommitted media asset uploaded for a job.

    Called when a generation job fails or is abandoned so orphaned uploads
    do not accumulate in GCS/Postgres. Committed assets (already attached to
    a persisted story) are never touched here.
    """
    async with session.begin():
        await advisory_transaction_lock(session, f"upload:{job_id}")
        assets = list(
            await session.scalars(
                select(MediaAsset).where(MediaAsset.job_id == job_id)
            )
        )
        deletable = [a for a in assets if a.commit_state == "uncommitted"]
        skipped_committed = len(assets) - len(deletable)

        for asset in deletable:
            await storage.delete(asset.storage_key)

        if deletable:
            await session.execute(
                delete(MediaAsset).where(
                    MediaAsset.id.in_([a.id for a in deletable])
                )
            )

    return JobMediaCleanupResult(
        job_id=job_id,
        deleted_assets=len(deletable),
        skipped_committed_assets=skipped_committed,
    )
