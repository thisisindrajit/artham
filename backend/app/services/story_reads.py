from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import APIError
from app.db.models import GeneratedStory, GeneratedStoryVersion, MediaAsset, StoryAssetLink
from app.schemas.story import (
    GeneratedStoryBundle,
    GeneratedStoryRead,
    GeneratedStorySummary,
    ValidationReport,
)
from app.services.storage import ObjectStorage


async def list_generated_stories(
    session: AsyncSession,
) -> list[GeneratedStorySummary]:
    versions = (
        await session.scalars(
            select(GeneratedStoryVersion)
            .join(
                GeneratedStory,
                (GeneratedStory.id == GeneratedStoryVersion.story_id)
                & (GeneratedStory.current_version == GeneratedStoryVersion.version),
            )
            .order_by(GeneratedStoryVersion.created_at.desc())
        )
    ).all()
    return [
        GeneratedStorySummary(
            story_id=version.story_id,
            version=version.version,
            title=version.title,
            subject={
                "domain": version.subject_domain,
                "discipline": version.subject_discipline,
            },
            difficulty=version.difficulty,
            estimated_minutes=GeneratedStoryBundle.model_validate(version.bundle)
            .storyline.estimated_minutes,
        )
        for version in versions
    ]


async def get_generated_story(
    *,
    session: AsyncSession,
    media_base_url: str,
    story_id: str,
) -> GeneratedStoryRead:
    version = await session.scalar(
        select(GeneratedStoryVersion)
        .join(
            GeneratedStory,
            (GeneratedStory.id == GeneratedStoryVersion.story_id)
            & (GeneratedStory.current_version == GeneratedStoryVersion.version),
        )
        .where(GeneratedStoryVersion.story_id == story_id)
    )
    if version is None:
        raise APIError(
            status_code=404,
            code="GENERATED_STORY_NOT_FOUND",
            message="The generated story does not exist.",
        )

    asset_rows = (
        await session.execute(
            select(StoryAssetLink.asset_key, MediaAsset.storage_key)
            .join(MediaAsset, MediaAsset.id == StoryAssetLink.asset_id)
            .where(
                StoryAssetLink.story_id == version.story_id,
                StoryAssetLink.version == version.version,
                MediaAsset.commit_state == "committed",
            )
        )
    ).all()
    media_urls = {
        asset_key: (
            f"{media_base_url}/api/v1/stories/{quote(story_id, safe='')}/media/"
            f"{quote(asset_key, safe='')}"
        )
        for asset_key, storage_key in asset_rows
    }
    return GeneratedStoryRead(
        story_id=version.story_id,
        version=version.version,
        bundle=GeneratedStoryBundle.model_validate(version.bundle),
        validation=ValidationReport.model_validate(version.validation),
        media_urls=media_urls,
    )


async def get_story_asset(
    *,
    session: AsyncSession,
    storage: ObjectStorage,
    story_id: str,
    asset_key: str,
) -> tuple[bytes, str]:
    asset = await session.scalar(
        select(MediaAsset)
        .join(StoryAssetLink, StoryAssetLink.asset_id == MediaAsset.id)
        .where(
            StoryAssetLink.story_id == story_id,
            StoryAssetLink.asset_key == asset_key,
            MediaAsset.commit_state == "committed",
        )
    )
    if asset is None:
        raise APIError(
            status_code=404,
            code="STORY_ASSET_NOT_FOUND",
            message="The requested story media asset does not exist.",
        )
    return await storage.download(asset.storage_key), asset.content_type
