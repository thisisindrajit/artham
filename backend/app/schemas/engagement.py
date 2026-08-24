from datetime import datetime

from pydantic import Field

from app.schemas.base import ContractModel
from app.schemas.story import Difficulty, SubjectRef


class EngagementStory(ContractModel):
    story_id: str
    subject: SubjectRef
    topic: str
    completed: bool
    completion_ratio: float = Field(ge=0, le=1)
    active_seconds: int = Field(ge=0)
    activity_accuracy: float | None = Field(default=None, ge=0, le=1)
    hints_used: int = Field(default=0, ge=0)
    replayed: bool = False
    learner_rating: int | None = Field(default=None, ge=1, le=5)
    completed_at: datetime | None = None


class EngagementProfile(ContractModel):
    learner_id: str
    stories: list[EngagementStory] = Field(default_factory=list, max_length=100)
    affinity_tags: list[str] = Field(default_factory=list, max_length=30)
    fatigue_tags: list[str] = Field(default_factory=list, max_length=30)
    preferred_difficulty: Difficulty = Difficulty.ADAPTIVE
    generated_at: datetime
