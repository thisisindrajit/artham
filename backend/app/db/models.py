from __future__ import annotations

from datetime import datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")
VECTOR_TYPE = JSON().with_variant(Vector(768), "postgresql")


class Learner(TimestampMixin, Base):
    __tablename__ = "learners"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    preferred_difficulty: Mapped[str] = mapped_column(
        String(16), default="adaptive", nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    allow_generated_stories: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class LearnerPreferenceTag(TimestampMixin, Base):
    __tablename__ = "learner_preference_tags"
    __table_args__ = (
        UniqueConstraint("learner_id", "kind", "tag"),
        CheckConstraint("kind IN ('affinity', 'fatigue')", name="valid_kind"),
        CheckConstraint("evidence_count > 0", name="positive_evidence_count"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    tag: Mapped[str] = mapped_column(String(120), nullable=False)
    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)


class StoryGenerationJob(TimestampMixin, Base):
    __tablename__ = "story_generation_jobs"
    __table_args__ = (
        UniqueConstraint("idempotency_key"),
        CheckConstraint("progress >= 0 AND progress <= 1", name="valid_progress"),
        Index("ix_jobs_status_created_at", "status", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), index=True
    )
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="queued", index=True)
    stage: Mapped[str] = mapped_column(String(80), default="queued")
    progress: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    error_code: Mapped[str | None] = mapped_column(String(80))
    error_message: Mapped[str | None] = mapped_column(Text)


class GeneratedStory(TimestampMixin, Base):
    __tablename__ = "generated_stories"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), index=True
    )
    current_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(
        String(24), default="unpublished", index=True, nullable=False
    )


class GeneratedStoryVersion(TimestampMixin, Base):
    __tablename__ = "generated_story_versions"
    __table_args__ = (
        CheckConstraint("target_age >= 13 AND target_age <= 18", name="valid_target_age"),
        Index("ix_story_versions_subject", "subject_domain", "subject_discipline"),
    )

    story_id: Mapped[str] = mapped_column(
        ForeignKey("generated_stories.id", ondelete="CASCADE"), primary_key=True
    )
    version: Mapped[int] = mapped_column(Integer, primary_key=True)
    schema_version: Mapped[str] = mapped_column(String(16), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    subject_domain: Mapped[str] = mapped_column(String(80), nullable=False)
    subject_discipline: Mapped[str] = mapped_column(String(120), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(16), nullable=False)
    target_age: Mapped[int] = mapped_column(Integer, nullable=False)
    synopsis: Mapped[str] = mapped_column(Text, nullable=False)
    bundle: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, nullable=False)
    validation: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, nullable=False)


class StorySource(Base):
    __tablename__ = "story_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    story_id: Mapped[str] = mapped_column(String(80), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    source_name: Mapped[str | None] = mapped_column(String(200))
    __table_args__ = (
        ForeignKeyConstraint(
            ["story_id", "version"],
            ["generated_story_versions.story_id", "generated_story_versions.version"],
            ondelete="CASCADE",
        ),
    )


class StoryScene(Base):
    __tablename__ = "story_scenes"
    __table_args__ = (
        ForeignKeyConstraint(
            ["story_id", "version"],
            ["generated_story_versions.story_id", "generated_story_versions.version"],
            ondelete="CASCADE",
        ),
        UniqueConstraint("story_id", "version", "scene_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    story_id: Mapped[str] = mapped_column(String(80), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    scene_id: Mapped[str] = mapped_column(String(64), nullable=False)
    act: Mapped[int] = mapped_column(Integer, nullable=False)
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False)
    scene: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, nullable=False)


class StoryActivity(Base):
    __tablename__ = "story_activities"
    __table_args__ = (
        ForeignKeyConstraint(
            ["story_id", "version"],
            ["generated_story_versions.story_id", "generated_story_versions.version"],
            ondelete="CASCADE",
        ),
        UniqueConstraint("story_id", "version", "activity_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    story_id: Mapped[str] = mapped_column(String(80), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    activity_id: Mapped[str] = mapped_column(String(128), nullable=False)
    scene_id: Mapped[str] = mapped_column(String(64), nullable=False)
    kind: Mapped[str] = mapped_column(String(24), nullable=False)
    activity: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, nullable=False)


class MediaAsset(TimestampMixin, Base):
    __tablename__ = "media_assets"
    __table_args__ = (
        UniqueConstraint("job_id", "asset_key"),
        CheckConstraint("byte_size > 0", name="positive_byte_size"),
    )

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    job_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    asset_key: Mapped[str] = mapped_column(String(128), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    scan_state: Mapped[str] = mapped_column(
        String(24), default="pending", index=True, nullable=False
    )
    commit_state: Mapped[str] = mapped_column(
        String(24), default="uncommitted", index=True, nullable=False
    )
    cdn_url: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    committed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class StoryAssetLink(Base):
    __tablename__ = "story_asset_links"
    __table_args__ = (
        ForeignKeyConstraint(
            ["story_id", "version"],
            ["generated_story_versions.story_id", "generated_story_versions.version"],
            ondelete="CASCADE",
        ),
        UniqueConstraint("story_id", "version", "asset_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    story_id: Mapped[str] = mapped_column(String(80), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    asset_id: Mapped[str] = mapped_column(
        ForeignKey("media_assets.id", ondelete="RESTRICT"), nullable=False
    )
    asset_key: Mapped[str] = mapped_column(String(128), nullable=False)
    scene_id: Mapped[str | None] = mapped_column(String(64))
    alt_text: Mapped[str | None] = mapped_column(Text)
    duration_seconds: Mapped[float | None] = mapped_column(Float)
    provider_model: Mapped[str] = mapped_column(String(200), nullable=False)


class StoryEmbedding(Base):
    __tablename__ = "story_embeddings"
    __table_args__ = (
        ForeignKeyConstraint(
            ["story_id", "version"],
            ["generated_story_versions.story_id", "generated_story_versions.version"],
            ondelete="CASCADE",
        ),
        UniqueConstraint("story_id", "version", "content_key"),
        CheckConstraint("dimensions = 768", name="dimensions_768"),
        Index(
            "ix_story_embeddings_vector_hnsw",
            "vector",
            postgresql_using="hnsw",
            postgresql_ops={"vector": "vector_cosine_ops"},
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    story_id: Mapped[str] = mapped_column(String(80), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    embedding_id: Mapped[str] = mapped_column(String(128), nullable=False)
    content_key: Mapped[str] = mapped_column(String(200), nullable=False)
    content_type: Mapped[str] = mapped_column(String(24), nullable=False)
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(String(200), nullable=False)
    dimensions: Mapped[int] = mapped_column(Integer, nullable=False)
    vector: Mapped[list[float]] = mapped_column(VECTOR_TYPE, nullable=False)


class LearnerStoryEngagement(TimestampMixin, Base):
    __tablename__ = "learner_story_engagement"
    __table_args__ = (
        UniqueConstraint("learner_id", "story_id", "session_id"),
        CheckConstraint(
            "completion_ratio >= 0 AND completion_ratio <= 1",
            name="valid_completion_ratio",
        ),
        CheckConstraint("active_seconds >= 0", name="nonnegative_active_seconds"),
        CheckConstraint("hints_used >= 0", name="nonnegative_hints_used"),
        CheckConstraint(
            "learner_rating IS NULL OR (learner_rating >= 1 AND learner_rating <= 5)",
            name="valid_learner_rating",
        ),
        Index("ix_engagement_learner_completed_at", "learner_id", "completed_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), index=True
    )
    story_id: Mapped[str] = mapped_column(
        ForeignKey("generated_stories.id", ondelete="CASCADE"), index=True
    )
    session_id: Mapped[str] = mapped_column(String(128), nullable=False)
    topic: Mapped[str] = mapped_column(String(200), nullable=False)
    subject_domain: Mapped[str] = mapped_column(String(80), nullable=False)
    subject_discipline: Mapped[str] = mapped_column(String(120), nullable=False)
    topic_tags: Mapped[list[str]] = mapped_column(JSON_TYPE, default=list, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completion_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    active_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    activity_correct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    activity_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hints_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    replayed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    learner_rating: Mapped[int | None] = mapped_column(Integer)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class IdempotencyKey(TimestampMixin, Base):
    __tablename__ = "idempotency_keys"
    __table_args__ = (UniqueConstraint("scope", "key"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(String(80), nullable=False)
    key: Mapped[str] = mapped_column(String(128), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_code: Mapped[int] = mapped_column(Integer, nullable=False)
    response_body: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
