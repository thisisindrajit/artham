import ssl
from collections.abc import AsyncIterator

import certifi
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()


def database_connect_args() -> dict[str, object]:
    if settings.database_url.startswith("postgresql+asyncpg://") and settings.database_ssl:
        return {"ssl": ssl.create_default_context(cafile=certifi.where())}
    return {}


engine = create_async_engine(
    settings.database_url,
    connect_args=database_connect_args(),
    pool_pre_ping=True,
)
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with async_session_factory() as session:
        yield session
