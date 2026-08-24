from typing import Annotated

from fastapi import APIRouter, Depends, Header, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import get_service_principal
from app.db.session import get_db_session
from app.schemas.engagement import EngagementProfile
from app.schemas.errors import ErrorResponse
from app.schemas.media import SignedUpload, UploadIntent
from app.schemas.story import BackendStoryWrite, PersistenceReceipt
from app.services.engagement import get_engagement_profile
from app.services.media import create_upload_intent
from app.services.storage import ObjectStorage, get_object_storage
from app.services.stories import persist_generated_story

router = APIRouter(
    prefix="/v1/internal",
    dependencies=[Depends(get_service_principal)],
    responses={
        400: {"model": ErrorResponse, "description": "Malformed or invalid request"},
        401: {"model": ErrorResponse, "description": "Invalid service identity"},
        403: {"model": ErrorResponse, "description": "Service is not authorized"},
        404: {"model": ErrorResponse, "description": "Resource does not exist"},
        409: {"model": ErrorResponse, "description": "Idempotency or state conflict"},
        413: {"model": ErrorResponse, "description": "Configured size limit exceeded"},
        422: {"model": ErrorResponse, "description": "Business invariant violation"},
        503: {"model": ErrorResponse, "description": "Transient dependency failure"},
    },
)


@router.get(
    "/learners/{learner_id:path}/story-engagement",
    response_model=EngagementProfile,
    summary="Read learner story engagement",
)
async def read_story_engagement(
    learner_id: Annotated[str, Path(min_length=1, max_length=128)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> EngagementProfile:
    return await get_engagement_profile(session, learner_id)


@router.post(
    "/media/upload-intents",
    response_model=SignedUpload,
    status_code=status.HTTP_200_OK,
    summary="Create a signed media upload",
)
async def create_media_upload(
    intent: UploadIntent,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    storage: Annotated[ObjectStorage, Depends(get_object_storage)],
    settings: Annotated[Settings, Depends(get_settings)],
    _idempotency_key: Annotated[
        str | None,
        Header(alias="Idempotency-Key", min_length=8, max_length=128),
    ] = None,
) -> SignedUpload:
    return await create_upload_intent(
        session=session,
        storage=storage,
        settings=settings,
        intent=intent,
    )


@router.post(
    "/generated-stories",
    response_model=PersistenceReceipt,
    summary="Atomically persist a generated story",
)
async def create_generated_story(
    write: BackendStoryWrite,
    idempotency_key: Annotated[
        str,
        Header(alias="Idempotency-Key", min_length=8, max_length=128),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    storage: Annotated[ObjectStorage, Depends(get_object_storage)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> PersistenceReceipt:
    return await persist_generated_story(
        session=session,
        storage=storage,
        settings=settings,
        write=write,
        idempotency_header=idempotency_key,
    )
