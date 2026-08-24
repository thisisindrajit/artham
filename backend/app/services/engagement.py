from datetime import UTC, datetime

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import APIError
from app.db.models import Learner, LearnerPreferenceTag, LearnerStoryEngagement
from app.schemas.engagement import EngagementProfile, EngagementStory
from app.schemas.story import Difficulty, SubjectRef


async def get_engagement_profile(session: AsyncSession, learner_id: str) -> EngagementProfile:
    learner = await session.get(Learner, learner_id)
    if learner is None or not learner.is_active:
        raise _engagement_not_found()

    rows = (
        await session.scalars(
            select(LearnerStoryEngagement)
            .where(LearnerStoryEngagement.learner_id == learner_id)
            .order_by(
                desc(LearnerStoryEngagement.completed_at),
                desc(LearnerStoryEngagement.created_at),
            )
            .limit(100)
        )
    ).all()
    if not rows:
        raise _engagement_not_found()

    tags = (
        await session.scalars(
            select(LearnerPreferenceTag)
            .where(LearnerPreferenceTag.learner_id == learner_id)
            .order_by(
                LearnerPreferenceTag.kind,
                desc(LearnerPreferenceTag.score),
                desc(LearnerPreferenceTag.evidence_count),
                LearnerPreferenceTag.tag,
            )
        )
    ).all()

    stories = [
        EngagementStory(
            story_id=row.story_id,
            subject=SubjectRef(
                domain=row.subject_domain,
                discipline=row.subject_discipline,
                topic_tags=row.topic_tags,
            ),
            topic=row.topic,
            completed=row.completed,
            completion_ratio=row.completion_ratio,
            active_seconds=row.active_seconds,
            activity_accuracy=(
                row.activity_correct / row.activity_total if row.activity_total > 0 else None
            ),
            hints_used=row.hints_used,
            replayed=row.replayed,
            learner_rating=row.learner_rating,
            completed_at=row.completed_at,
        )
        for row in rows
    ]
    return EngagementProfile(
        learner_id=learner_id,
        stories=stories,
        affinity_tags=[tag.tag for tag in tags if tag.kind == "affinity"][:30],
        fatigue_tags=[tag.tag for tag in tags if tag.kind == "fatigue"][:30],
        preferred_difficulty=Difficulty(learner.preferred_difficulty),
        generated_at=datetime.now(UTC),
    )


def _engagement_not_found() -> APIError:
    return APIError(
        status_code=404,
        code="ENGAGEMENT_NOT_FOUND",
        message="No story engagement history exists for this learner.",
    )
