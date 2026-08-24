from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def advisory_transaction_lock(session: AsyncSession, key: str) -> None:
    bind = session.get_bind()
    if bind.dialect.name != "postgresql":
        return
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))"),
        {"key": key},
    )
