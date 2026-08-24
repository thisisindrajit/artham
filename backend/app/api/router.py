from fastapi import APIRouter

from app.api.routes import health, internal, stories

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(stories.router, tags=["stories"])

internal_router = APIRouter()
internal_router.include_router(internal.router, tags=["internal"])
