import asyncio
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings, get_settings
from app.db.base import Base
from app.db.session import get_db_session
from app.main import app
from app.services.storage import ObjectMetadata, get_object_storage


class FakeObjectStorage:
    def __init__(self) -> None:
        self.objects: dict[str, ObjectMetadata] = {}

    async def create_signed_put(
        self,
        *,
        storage_key: str,
        content_type: str,
        byte_size: int,
        sha256: str,
        expires_in: int,
    ) -> tuple[str, dict[str, str]]:
        self.objects[storage_key] = ObjectMetadata(
            content_type=content_type,
            byte_size=byte_size,
            sha256=sha256,
        )
        return (
            f"https://uploads.example.test/{storage_key}?expires={expires_in}",
            {"content-type": content_type},
        )

    async def create_signed_get(self, *, storage_key: str, expires_in: int) -> str:
        return f"https://media.example.test/{storage_key}?expires={expires_in}"

    async def download(self, storage_key: str) -> bytes:
        return storage_key.encode()

    async def inspect(self, storage_key: str) -> ObjectMetadata:
        return self.objects[storage_key]

    async def delete(self, storage_key: str) -> None:
        self.objects.pop(storage_key, None)


@pytest.fixture(scope="session")
def database_engine(tmp_path_factory: pytest.TempPathFactory) -> Iterator[AsyncEngine]:
    database_path: Path = tmp_path_factory.mktemp("db") / "test.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{database_path}")

    async def create_schema() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    asyncio.run(create_schema())
    yield engine
    asyncio.run(engine.dispose())


@pytest.fixture
def session_factory(
    database_engine: AsyncEngine,
) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(database_engine, expire_on_commit=False)


@pytest.fixture
def object_storage() -> FakeObjectStorage:
    return FakeObjectStorage()


@pytest.fixture
def client(
    session_factory: async_sessionmaker[AsyncSession],
    object_storage: FakeObjectStorage,
    auth_headers: dict[str, str],
) -> Iterator[TestClient]:
    _, internal_api_key = auth_headers["Authorization"].split(" ", maxsplit=1)
    settings = Settings(
        _env_file=None,
        database_url="sqlite+aiosqlite:///:memory:",
        database_ssl=False,
        internal_api_key=internal_api_key,
    )

    async def override_db_session() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_db_session] = override_db_session
    app.dependency_overrides[get_object_storage] = lambda: object_storage
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer local-development-only"}
