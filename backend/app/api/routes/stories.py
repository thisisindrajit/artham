from typing import Annotated

from fastapi import APIRouter, Depends, Path, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.schemas.story import GeneratedStoryRead, GeneratedStorySummary
from app.services.storage import ObjectStorage, get_object_storage
from app.services.story_reads import (
    get_generated_story,
    get_story_asset,
    list_generated_stories,
)

router = APIRouter(prefix="/stories")


@router.get("", response_model=list[GeneratedStorySummary])
async def list_stories(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[GeneratedStorySummary]:
    return await list_generated_stories(session)


@router.get("/{story_id}", response_model=GeneratedStoryRead)
async def read_story(
    story_id: Annotated[str, Path(min_length=3, max_length=80)],
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> GeneratedStoryRead:
    return await get_generated_story(
        session=session,
        media_base_url=str(request.base_url).rstrip("/"),
        story_id=story_id,
    )


@router.get("/{story_id}/media/{asset_key}")
async def read_story_media(
    story_id: Annotated[str, Path(min_length=3, max_length=80)],
    asset_key: Annotated[str, Path(min_length=1, max_length=128)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    storage: Annotated[ObjectStorage, Depends(get_object_storage)],
) -> Response:
    data, content_type = await get_story_asset(
        session=session,
        storage=storage,
        story_id=story_id,
        asset_key=asset_key,
    )
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "private, max-age=300"},
    )
