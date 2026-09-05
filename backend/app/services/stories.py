from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.exceptions import APIError
from app.db.models import (
    GeneratedStory,
    GeneratedStoryVersion,
    IdempotencyKey,
    Learner,
    MediaAsset,
    StoryActivity,
    StoryAssetLink,
    StoryEmbedding,
    StoryGenerationJob,
    StoryScene,
    StorySource,
)
from app.schemas.story import BackendStoryWrite, PersistenceReceipt
from app.services.hashing import canonical_hash
from app.services.locks import advisory_transaction_lock
from app.services.storage import ObjectMetadata, ObjectStorage

IDEMPOTENCY_SCOPE = "generated-story"


async def persist_generated_story(
    *,
    session: AsyncSession,
    storage: ObjectStorage,
    settings: Settings,
    write: BackendStoryWrite,
    idempotency_header: str,
) -> PersistenceReceipt:
    _validate_business_invariants(write, settings, idempotency_header)
    body = write.model_dump(mode="json")
    request_hash = canonical_hash(body)
    now = datetime.now(UTC)

    async with session.begin():
        await advisory_transaction_lock(
            session, f"idempotency:{IDEMPOTENCY_SCOPE}:{write.idempotency_key}"
        )
        replay = await _find_idempotent_replay(session, write.idempotency_key, request_hash)
        if replay is not None:
            return replay
        await advisory_transaction_lock(session, f"story:{write.bundle.storyline.story_id}")

        learner = await session.scalar(
            select(Learner).where(Learner.id == write.bundle.learner_id).with_for_update()
        )
        if learner is None:
            learner = Learner(id=write.bundle.learner_id)
            session.add(learner)
            await session.flush()
        if not learner.is_active:
            raise APIError(
                status_code=404,
                code="LEARNER_NOT_FOUND",
                message="The learner does not exist.",
            )
        if not learner.allow_generated_stories:
            raise APIError(
                status_code=403,
                code="GENERATION_NOT_ALLOWED",
                message="Story generation is not allowed for this learner.",
            )

        job = await session.get(StoryGenerationJob, write.bundle.generation_job_id)
        if job is not None and job.learner_id != learner.id:
            raise APIError(
                status_code=403,
                code="JOB_LEARNER_MISMATCH",
                message="The generation job does not belong to this learner.",
            )

        assets = await _verify_assets(session, storage, settings, write, now)
        storyline = write.bundle.storyline
        story = await session.scalar(
            select(GeneratedStory).where(GeneratedStory.id == storyline.story_id).with_for_update()
        )
        if story is None:
            story = GeneratedStory(
                id=storyline.story_id,
                learner_id=learner.id,
                current_version=1,
                status="unpublished",
            )
            session.add(story)
            version = 1
        else:
            if story.learner_id != learner.id:
                raise APIError(
                    status_code=409,
                    code="STORY_OWNERSHIP_CONFLICT",
                    message="The story identifier belongs to another learner.",
                )
            version = story.current_version + 1
            story.current_version = version

        session.add(
            GeneratedStoryVersion(
                story_id=story.id,
                version=version,
                schema_version=write.bundle.schema_version,
                title=storyline.title,
                subject_domain=storyline.subject.domain,
                subject_discipline=storyline.subject.discipline,
                difficulty=storyline.difficulty.value,
                target_age=storyline.target_age,
                synopsis=storyline.synopsis,
                bundle=body["bundle"],
                validation=body["validation"],
            )
        )
        session.add_all(
            [
                StorySource(
                    story_id=story.id,
                    version=version,
                    url=str(source.url),
                    title=source.title,
                    excerpt=source.excerpt,
                    published_at=source.published_at,
                    source_name=source.source_name,
                )
                for source in storyline.citations
            ]
        )
        session.add_all(
            [
                StoryScene(
                    story_id=story.id,
                    version=version,
                    scene_id=scene.scene_id,
                    act=scene.act,
                    ordinal=ordinal,
                    scene=scene.model_dump(mode="json"),
                )
                for ordinal, scene in enumerate(storyline.scenes)
            ]
        )
        session.add_all(
            [
                StoryActivity(
                    story_id=story.id,
                    version=version,
                    activity_id=activity.activity_id,
                    scene_id=activity.scene_id,
                    kind=activity.kind.value,
                    activity=activity.model_dump(mode="json"),
                )
                for activity in write.bundle.activities.activities
            ]
        )
        session.add_all(
            [
                StoryAssetLink(
                    story_id=story.id,
                    version=version,
                    asset_id=asset_ref.asset_id,
                    asset_key=asset_ref.asset_key,
                    scene_id=asset_ref.scene_id,
                    alt_text=asset_ref.alt_text,
                    duration_seconds=asset_ref.duration_seconds,
                    provider_model=asset_ref.provider_model,
                )
                for asset_ref in write.bundle.assets
            ]
        )
        session.add_all(
            [
                StoryEmbedding(
                    story_id=story.id,
                    version=version,
                    embedding_id=embedding.embedding_id,
                    content_key=embedding.content_key,
                    content_type=embedding.content_type,
                    source_text=embedding.text,
                    model=embedding.model,
                    dimensions=embedding.dimensions,
                    vector=embedding.vector,
                )
                for embedding in write.bundle.embeddings
            ]
        )

        for asset in assets:
            asset.commit_state = "committed"
            asset.committed_at = now
        if job is not None:
            job.status = "succeeded"
            job.stage = "persisted"
            job.progress = 1

        receipt = PersistenceReceipt(
            story_id=story.id,
            version=version,
            persisted_at=now,
        )
        session.add(
            IdempotencyKey(
                scope=IDEMPOTENCY_SCOPE,
                key=write.idempotency_key,
                request_hash=request_hash,
                response_code=200,
                response_body=receipt.model_dump(mode="json"),
                expires_at=now + timedelta(days=7),
            )
        )
    return receipt


def _validate_business_invariants(
    write: BackendStoryWrite, settings: Settings, idempotency_header: str
) -> None:
    if idempotency_header != write.idempotency_key:
        raise APIError(
            status_code=400,
            code="IDEMPOTENCY_KEY_MISMATCH",
            message="The Idempotency-Key header must match the request body.",
        )
    if not write.validation.is_valid:
        raise APIError(
            status_code=422,
            code="STORY_VALIDATION_FAILED",
            message="Only a valid story bundle can be persisted.",
        )

    storyline = write.bundle.storyline
    scene_ids = [scene.scene_id for scene in storyline.scenes]
    if len(scene_ids) != len(set(scene_ids)) or storyline.opening_scene_id not in scene_ids:
        raise APIError(
            status_code=422,
            code="INVALID_SCENE_GRAPH",
            message="Scene identifiers must be unique and include the opening scene.",
        )

    activities = write.bundle.activities.activities
    activity_ids = [activity.activity_id for activity in activities]
    if len(activity_ids) != len(set(activity_ids)) or any(
        activity.scene_id not in scene_ids for activity in activities
    ):
        raise APIError(
            status_code=422,
            code="INVALID_ACTIVITY_LINK",
            message="Activities must be unique and reference an existing scene.",
        )

    assets = write.bundle.assets
    asset_keys = [asset.asset_key for asset in assets]
    asset_ids = [asset.asset_id for asset in assets]
    if len(asset_keys) != len(set(asset_keys)) or len(asset_ids) != len(set(asset_ids)):
        raise APIError(
            status_code=422,
            code="DUPLICATE_ASSET",
            message="Asset identifiers and keys must be unique.",
        )

    planned_keys = {image.asset_key for image in write.bundle.media_plan.images}
    if write.bundle.media_plan.video:
        planned_keys.add(write.bundle.media_plan.video.asset_key)
    if write.bundle.media_plan.audio:
        planned_keys.add(write.bundle.media_plan.audio.asset_key)
    if set(asset_keys) != planned_keys:
        raise APIError(
            status_code=422,
            code="ASSET_PLAN_MISMATCH",
            message="Persisted assets must exactly match the media plan.",
        )

    embeddings = write.bundle.embeddings
    content_keys = [embedding.content_key for embedding in embeddings]
    if len(content_keys) != len(set(content_keys)):
        raise APIError(
            status_code=422,
            code="DUPLICATE_EMBEDDING",
            message="Embedding content keys must be unique.",
        )
    if any(
        embedding.dimensions != settings.embedding_dimensions
        or len(embedding.vector) != settings.embedding_dimensions
        for embedding in embeddings
    ):
        raise APIError(
            status_code=422,
            code="INVALID_EMBEDDING_DIMENSIONS",
            message=(
                f"Every embedding must contain exactly {settings.embedding_dimensions} dimensions."
            ),
        )
    if len({embedding.model for embedding in embeddings}) > 1:
        raise APIError(
            status_code=422,
            code="MIXED_EMBEDDING_MODELS",
            message="A story version cannot mix embedding models.",
        )


async def _find_idempotent_replay(
    session: AsyncSession, key: str, request_hash: str
) -> PersistenceReceipt | None:
    record = await session.scalar(
        select(IdempotencyKey)
        .where(
            IdempotencyKey.scope == IDEMPOTENCY_SCOPE,
            IdempotencyKey.key == key,
        )
        .with_for_update()
    )
    if record is None:
        return None
    if record.request_hash != request_hash:
        raise APIError(
            status_code=409,
            code="IDEMPOTENCY_KEY_CONFLICT",
            message="The idempotency key was already used for different content.",
        )
    return PersistenceReceipt.model_validate(record.response_body)


async def _verify_assets(
    session: AsyncSession,
    storage: ObjectStorage,
    settings: Settings,
    write: BackendStoryWrite,
    now: datetime,
) -> list[MediaAsset]:
    references = {asset.asset_id: asset for asset in write.bundle.assets}
    if not references:
        return []
    assets = list(
        (
            await session.scalars(
                select(MediaAsset).where(MediaAsset.id.in_(references)).with_for_update()
            )
        ).all()
    )
    if len(assets) != len(references):
        raise APIError(
            status_code=422,
            code="ASSET_NOT_FOUND",
            message="One or more referenced assets do not exist.",
        )

    # An asset already committed to *this* story may be re-committed: that is
    # how a new version keeps the media the previous version generated.
    reusable = set(
        (
            await session.scalars(
                select(StoryAssetLink.asset_id).where(
                    StoryAssetLink.story_id == write.bundle.storyline.story_id
                )
            )
        ).all()
    )

    for asset in assets:
        reference = references[asset.id]
        if asset.job_id != write.bundle.generation_job_id:
            raise APIError(
                status_code=403,
                code="ASSET_JOB_MISMATCH",
                message=f"Asset {asset.id} does not belong to this generation job.",
            )
        if _as_utc(asset.expires_at) <= now:
            raise APIError(
                status_code=422,
                code="ASSET_EXPIRED",
                message=f"Asset {asset.id} has expired.",
            )
        if asset.commit_state != "uncommitted" and asset.id not in reusable:
            raise APIError(
                status_code=409,
                code="ASSET_ALREADY_COMMITTED",
                message=f"Asset {asset.id} is already committed.",
            )
        if asset.scan_state == "quarantined":
            raise APIError(
                status_code=422,
                code="ASSET_QUARANTINED",
                message=f"Asset {asset.id} did not pass media scanning.",
            )

        expected = (
            reference.asset_key,
            reference.kind.value,
            reference.content_type,
            reference.byte_size,
            reference.sha256,
            str(reference.url),
        )
        actual = (
            asset.asset_key,
            asset.kind,
            asset.content_type,
            asset.byte_size,
            asset.sha256,
            asset.cdn_url,
        )
        if actual != expected:
            raise APIError(
                status_code=422,
                code="ASSET_METADATA_MISMATCH",
                message=f"Asset {asset.id} does not match its upload intent.",
            )

        metadata = await storage.inspect(asset.storage_key)
        _validate_object_metadata(asset, metadata)
        if settings.media_scan_required and asset.scan_state != "clean":
            raise APIError(
                status_code=422,
                code="ASSET_SCAN_PENDING",
                message=f"Asset {asset.id} has not completed media scanning.",
            )
        if not settings.media_scan_required:
            asset.scan_state = "clean"
    return assets


def _validate_object_metadata(asset: MediaAsset, metadata: ObjectMetadata) -> None:
    if metadata.byte_size != asset.byte_size:
        raise APIError(
            status_code=422,
            code="ASSET_SIZE_MISMATCH",
            message=f"Asset {asset.id} does not match its declared byte size.",
        )
    if metadata.content_type != asset.content_type:
        raise APIError(
            status_code=422,
            code="ASSET_MIME_MISMATCH",
            message=f"Asset {asset.id} does not match its declared MIME type.",
        )
    if metadata.sha256 != asset.sha256:
        raise APIError(
            status_code=422,
            code="ASSET_CHECKSUM_MISMATCH",
            message=f"Asset {asset.id} does not match its declared checksum.",
        )


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
