"""Strict data contracts shared by every story-generation stage."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)

from .constants import (
    MAX_IMAGE_ASSETS,
    MAX_STORY_MINUTES,
    MAX_TARGET_AGE,
    MAX_VIDEO_CLIPS,
    MAX_VIDEO_SECONDS,
    MIN_STORY_MINUTES,
    MIN_TARGET_AGE,
)


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Difficulty(StrEnum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    ADAPTIVE = "adaptive"


class ActivityKind(StrEnum):
    QUIZ = "quiz"
    REORDER = "reorder"
    SIMULATION = "simulation"
    REFLECTION = "reflection"
    SLIDER = "slider"


class AssetKind(StrEnum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class JobState(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ValidationSeverity(StrEnum):
    ERROR = "error"
    WARNING = "warning"


class RepairComponent(StrEnum):
    STORYLINE = "storyline"
    ACTIVITIES = "activities"
    MEDIA_PLAN = "media_plan"
    ASSETS = "assets"
    EMBEDDINGS = "embeddings"


class SubjectRef(ContractModel):
    """Extensible academic taxonomy rather than a fixed frontend enum."""

    domain: str = Field(min_length=2, max_length=80)
    discipline: str = Field(min_length=2, max_length=120)
    topic_tags: list[str] = Field(default_factory=list, max_length=12)

    @field_validator("discipline")
    @classmethod
    def discipline_is_brief(cls, value: str) -> str:
        if len(value.split()) > 2:
            raise ValueError("discipline must contain at most two words")
        return value


class VideoBudget(ContractModel):
    enabled: bool = True
    max_clips: int = Field(default=1, ge=0, le=MAX_VIDEO_CLIPS)
    max_total_seconds: int = Field(default=10, ge=0, le=MAX_VIDEO_SECONDS)

    @model_validator(mode="after")
    def disabled_budget_is_zero(self) -> "VideoBudget":
        if not self.enabled and (self.max_clips or self.max_total_seconds):
            raise ValueError("disabled video budgets must have zero limits")
        return self


class MediaBudget(ContractModel):
    max_images: int = Field(default=6, ge=1, le=MAX_IMAGE_ASSETS)
    video: VideoBudget = Field(default_factory=VideoBudget)
    generate_background_audio: bool = True


class StoryGenerationRequest(ContractModel):
    learner_id: str = Field(min_length=1, max_length=128)
    idempotency_key: str = Field(min_length=8, max_length=128)
    target_age: int = Field(default=18, ge=MIN_TARGET_AGE, le=MAX_TARGET_AGE)
    duration_minutes: int = Field(
        default=8, ge=MIN_STORY_MINUTES, le=MAX_STORY_MINUTES
    )
    difficulty: Difficulty = Difficulty.ADAPTIVE
    preferred_subjects: list[SubjectRef] = Field(default_factory=list, max_length=8)
    excluded_topics: list[str] = Field(default_factory=list, max_length=30)
    locale: str = Field(default="en-US", pattern=r"^[a-z]{2,3}(?:-[A-Z]{2})?$")
    media_budget: MediaBudget = Field(default_factory=MediaBudget)


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


class SourceEvidence(ContractModel):
    title: str
    url: HttpUrl
    published_at: datetime | None = None
    excerpt: str = Field(min_length=20, max_length=1200)
    source_name: str | None = None


class OpenLearningImage(ContractModel):
    title: str = Field(min_length=4, max_length=160)
    image_url: HttpUrl
    source_page_url: HttpUrl
    source_name: str = Field(min_length=2, max_length=120)
    license_name: Literal[
        "Public domain",
        "CC BY 4.0",
        "CC BY-SA 4.0",
        "CC BY 3.0",
        "CC BY-SA 3.0",
        "CC0 1.0",
    ]
    license_url: HttpUrl
    alt_text: str = Field(min_length=12, max_length=300)


class ResearchCorpus(ContractModel):
    query: str
    sources: list[SourceEvidence] = Field(min_length=3, max_length=30)
    reference_images: list[OpenLearningImage] = Field(
        default_factory=list, max_length=6
    )


class TopicCandidate(ContractModel):
    candidate_id: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{2,63}$")
    title: str = Field(min_length=4, max_length=120)
    subject: SubjectRef
    premise: str = Field(min_length=40, max_length=700)
    learning_objectives: list[str] = Field(min_length=1, max_length=4)
    why_now: str = Field(min_length=20, max_length=500)
    source_evidence: list[SourceEvidence] = Field(min_length=1, max_length=8)
    novelty_score: float = Field(ge=0, le=1)
    story_potential_score: float = Field(ge=0, le=1)
    age_suitability_score: float = Field(ge=0, le=1)


class TopicCandidates(ContractModel):
    candidates: list[TopicCandidate] = Field(min_length=1, max_length=4)


class SelectedTopic(ContractModel):
    candidate: TopicCandidate
    engagement_rationale: str = Field(min_length=30, max_length=800)
    predicted_engagement_score: float = Field(ge=0, le=1)
    novelty_balance: str = Field(min_length=20, max_length=400)


class ChoiceDraft(ContractModel):
    choice_id: str
    label: str = Field(min_length=2, max_length=140)
    consequence: str = Field(min_length=10, max_length=500)
    correct: bool
    detail: str | None = None
    approach: Literal[
        "measure_first",
        "act_first",
        "brute_force",
        "isolate_variable",
        "change_many",
        "seek_pattern",
        "follow_authority",
        "abandon_hypothesis",
        "commit_to_hypothesis",
    ] | None = None


class SceneDraft(ContractModel):
    scene_id: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{1,63}$")
    act: Literal[1, 2, 3]
    title: str = Field(min_length=2, max_length=100)
    narrative: list[str] = Field(min_length=1, max_length=8)
    learning_purpose: str = Field(min_length=20, max_length=500)
    interaction_slot: ActivityKind | None = None
    choices: list[ChoiceDraft] = Field(default_factory=list, max_length=6)
    next_scene_id: str | None = None
    media_cue: str = Field(min_length=10, max_length=500)
    scene_type: Literal[
        "narrative", "choice", "slider", "reorder", "reflect", "ending"
    ]
    mood: Literal["calm", "tense", "alarm", "insight", "night", "resolve"]
    beat: str = Field(min_length=2, max_length=32)
    hints: list[str] | None = Field(default=None, min_length=3, max_length=3)
    concept: str | None = None
    probe: str | None = None
    primer: list["ScenePrimer"] = Field(default_factory=list, max_length=2)
    trivia: "SceneTrivia | None" = None
    learning_reference: "SceneLearningReference | None" = None
    outcome: Literal["success", "partial"] | None = None


class ScenePrimer(ContractModel):
    term: str = Field(min_length=2, max_length=80)
    plain: str = Field(min_length=20, max_length=320)
    like: str = Field(min_length=12, max_length=240)


class SceneTrivia(ContractModel):
    emoji: str = Field(min_length=1, max_length=8)
    title: str = Field(min_length=4, max_length=80)
    text: str = Field(min_length=20, max_length=320)


class SceneLearningReference(OpenLearningImage):
    plain_explanation: str = Field(min_length=30, max_length=420)
    why_important: str = Field(min_length=30, max_length=360)


class StoryTakeaway(ContractModel):
    concept: str = Field(min_length=4, max_length=120)
    field: str = Field(min_length=4, max_length=120)
    in_one_line: str = Field(min_length=40, max_length=500)
    rule: str = Field(min_length=40, max_length=500)
    elsewhere: list[str] = Field(min_length=3, max_length=3)
    you_used_it: list[str] = Field(min_length=3, max_length=4)


class PreSessionOption(ContractModel):
    id: str
    label: str = Field(min_length=8, max_length=180)
    approach: Literal[
        "measure_first",
        "act_first",
        "brute_force",
        "isolate_variable",
        "change_many",
        "seek_pattern",
        "follow_authority",
        "abandon_hypothesis",
        "commit_to_hypothesis",
    ]


class PreSessionQuestion(ContractModel):
    prompt: str = Field(min_length=20, max_length=300)
    options: list[PreSessionOption] = Field(min_length=4, max_length=4)


class StoryIntro(ContractModel):
    role: str = Field(min_length=3, max_length=100)
    text: list[str] = Field(min_length=1, max_length=4)
    cta: str = Field(min_length=4, max_length=60)


class StoryCharacter(ContractModel):
    name: str = Field(min_length=2, max_length=60)
    role: str = Field(min_length=3, max_length=100)
    visual_description: str = Field(min_length=20, max_length=300)


class StorylineDraft(ContractModel):
    story_id: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{2,79}$")
    title: str = Field(min_length=3, max_length=100)
    tagline: str = Field(min_length=10, max_length=180)
    synopsis: str = Field(min_length=80, max_length=360)
    subject: SubjectRef
    target_age: int = Field(ge=MIN_TARGET_AGE, le=MAX_TARGET_AGE)
    difficulty: Difficulty
    estimated_minutes: int = Field(
        ge=MIN_STORY_MINUTES, le=MAX_STORY_MINUTES
    )
    learning_objectives: list[str] = Field(min_length=1, max_length=4)
    opening_scene_id: str
    scenes: list[SceneDraft] = Field(min_length=5, max_length=24)
    takeaway: str = Field(min_length=30, max_length=800)
    citations: list[SourceEvidence] = Field(min_length=1, max_length=12)
    learning_goal: str = Field(min_length=20, max_length=280)
    stage_label: str
    partner_greeting: str
    characters: list[StoryCharacter] = Field(min_length=2, max_length=4)
    intro: StoryIntro
    pre_session: PreSessionQuestion
    player_takeaway: StoryTakeaway


class QuizOption(ContractModel):
    option_id: str
    label: str


class QuizSpec(ContractModel):
    prompt: str
    options: list[QuizOption] = Field(min_length=3, max_length=6)
    correct_option_ids: list[str] = Field(min_length=1, max_length=3)
    explanation: str


class ReorderItem(ContractModel):
    item_id: str
    label: str
    detail: str | None = None


class ReorderSpec(ContractModel):
    prompt: str
    items: list[ReorderItem] = Field(min_length=3, max_length=8)
    correct_order: list[str] = Field(min_length=3, max_length=8)
    explanation: str
    instruction: str
    wrong: str
    right: str


class SimulationControl(ContractModel):
    control_id: str
    label: str
    minimum: float
    maximum: float
    step: float = Field(gt=0)
    initial: float
    unit: str = ""

    @model_validator(mode="after")
    def values_are_in_range(self) -> "SimulationControl":
        if self.minimum >= self.maximum:
            raise ValueError("simulation minimum must be below maximum")
        if not self.minimum <= self.initial <= self.maximum:
            raise ValueError("simulation initial value must be within its range")
        return self


class SimulationLookupCase(ContractModel):
    when: dict[str, float] = Field(max_length=4)
    value: str = Field(min_length=1, max_length=80)


class SimulationReadout(ContractModel):
    readout_id: str = Field(pattern=r"^[a-z][a-z0-9_]{1,63}$")
    label: str = Field(min_length=2, max_length=100)
    operation: Literal[
        "identity",
        "linear",
        "sum",
        "difference",
        "product",
        "share_percent",
        "base_conversion",
        "lookup",
    ]
    input_ids: list[str] = Field(min_length=1, max_length=4)
    params: dict[str, float] = Field(default_factory=dict, max_length=8)
    cases: list[SimulationLookupCase] = Field(default_factory=list, max_length=32)
    fallback: str = Field(default="—", min_length=1, max_length=80)
    success_value: str = Field(min_length=1, max_length=80)
    unit: str = Field(default="", max_length=24)
    decimals: int = Field(default=0, ge=0, le=4)


class SimulationSpec(ContractModel):
    prompt: str
    model_kind: str = Field(
        description="Frontend renderer identifier, never executable code."
    )
    controls: list[SimulationControl] = Field(min_length=1, max_length=4)
    observed_variables: list[str] = Field(min_length=1, max_length=6)
    readouts: list[SimulationReadout] = Field(
        default_factory=list, min_length=1, max_length=6
    )
    success_condition: str = Field(
        description="A declarative condition consumed by a trusted renderer."
    )
    explanation: str
    guide: "SimulationGuide | None" = None


class SimulationGuide(ContractModel):
    shows: str = Field(min_length=20, max_length=400)
    move: str = Field(min_length=20, max_length=400)
    watch: str = Field(min_length=20, max_length=400)


class SliderBand(ContractModel):
    max: float
    text: str = Field(min_length=10, max_length=240)


class SliderSpec(ContractModel):
    prompt: str
    label: str
    unit: str = ""
    minimum: float
    maximum: float
    step: float = Field(gt=0)
    initial: float
    target_minimum: float
    target_maximum: float
    readout_label: str
    readout_unit: str = ""
    readout_expr: Literal[
        "resonance_ratio",
        "natural_frequency",
        "peak_temperature",
        "market_rent",
        "profile_pool",
        "night_march",
        "linear",
    ]
    readout_params: dict[str, float]
    readout_decimals: int = Field(ge=0, le=3)
    driver_label: str
    driver_value: float
    driver_unit: str = ""
    driver_expr: Literal["fixed", "part_of_total_percent"] = "fixed"
    driver_params: dict[str, float] = Field(default_factory=dict, max_length=4)
    risk_mode: Literal["separation", "ceiling"]
    risk_safe_gap: float = Field(gt=0)
    meter: Literal["wave", "thermometer", "market", "crowd", "gauge"]
    bands: list[SliderBand] = Field(min_length=3, max_length=6)
    explanation: str
    guide: SimulationGuide

    @model_validator(mode="after")
    def ranges_are_playable(self) -> "SliderSpec":
        if self.minimum >= self.maximum:
            raise ValueError("slider minimum must be below maximum")
        if not self.minimum <= self.initial <= self.maximum:
            raise ValueError("slider initial value must be within its range")
        if not (
            self.minimum
            <= self.target_minimum
            <= self.target_maximum
            <= self.maximum
        ):
            raise ValueError("slider target must be an ordered range within bounds")
        if any(
            current.max >= following.max
            for current, following in zip(self.bands, self.bands[1:])
        ):
            raise ValueError("slider bands must be ordered by increasing maximum")
        return self


class ReflectionSpec(ContractModel):
    prompt: str
    placeholder: str
    evidence_to_notice: list[str] = Field(min_length=1, max_length=4)


class ActivitySpec(ContractModel):
    activity_id: str
    scene_id: str
    kind: ActivityKind
    learning_objective: str
    quiz: QuizSpec | None = None
    reorder: ReorderSpec | None = None
    simulation: SimulationSpec | None = None
    reflection: ReflectionSpec | None = None
    slider: SliderSpec | None = None

    @model_validator(mode="after")
    def exactly_one_matching_payload(self) -> "ActivitySpec":
        payloads = {
            ActivityKind.QUIZ: self.quiz,
            ActivityKind.REORDER: self.reorder,
            ActivityKind.SIMULATION: self.simulation,
            ActivityKind.REFLECTION: self.reflection,
            ActivityKind.SLIDER: self.slider,
        }
        present = [kind for kind, payload in payloads.items() if payload is not None]
        if present != [self.kind]:
            raise ValueError("activity kind must match its single payload")
        if self.simulation is not None and self.simulation.guide is None:
            raise ValueError("simulation activities must include a guide")
        return self


class ActivityPlan(ContractModel):
    activities: list[ActivitySpec] = Field(min_length=2, max_length=12)


class ImageRequest(ContractModel):
    asset_key: str
    scene_id: str | None = None
    prompt: str = Field(min_length=30, max_length=1800)
    alt_text: str = Field(min_length=10, max_length=300)
    aspect_ratio: Literal["1:1", "4:3", "3:4", "16:9", "9:16"] = "16:9"


class VideoRequest(ContractModel):
    asset_key: str
    scene_id: str
    prompt: str = Field(min_length=40, max_length=1800)
    narrative_necessity: str = Field(min_length=30, max_length=600)
    duration_seconds: Literal[4, 6, 8] = 8
    aspect_ratio: Literal["16:9"] = "16:9"
    style: str = Field(
        default="diegetic footage with no readable text or identifiable people"
    )


class AudioRequest(ContractModel):
    asset_key: str
    prompt: str = Field(min_length=30, max_length=1600)
    negative_prompt: str = Field(default="", max_length=800)
    loopable: bool = True


class MediaPlan(ContractModel):
    images: list[ImageRequest] = Field(default_factory=list, max_length=MAX_IMAGE_ASSETS)
    video: VideoRequest | None = None
    audio: AudioRequest | None = None
    visual_style_guide: str = Field(min_length=30, max_length=1000)


class VideoDecision(ContractModel):
    approved: bool
    reason: str = Field(min_length=20, max_length=600)
    approved_request: VideoRequest | None = None

    @model_validator(mode="after")
    def approved_video_has_request(self) -> "VideoDecision":
        if self.approved != (self.approved_request is not None):
            raise ValueError("approved video decisions must include a request")
        return self


class AssetReference(ContractModel):
    asset_id: str
    asset_key: str
    kind: AssetKind
    url: HttpUrl
    content_type: str
    byte_size: int = Field(gt=0)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    scene_id: str | None = None
    alt_text: str | None = None
    duration_seconds: float | None = Field(default=None, gt=0)
    provider_model: str


class EmbeddingRecord(ContractModel):
    embedding_id: str
    content_key: str
    content_type: Literal["story", "scene", "activity", "topic"]
    text: str
    vector: list[float] = Field(min_length=1)
    dimensions: int = Field(gt=0)
    model: str

    @model_validator(mode="after")
    def dimensions_match_vector(self) -> "EmbeddingRecord":
        if len(self.vector) != self.dimensions:
            raise ValueError("embedding dimensions do not match vector length")
        return self


class GenerationArtifacts(ContractModel):
    assets: list[AssetReference] = Field(default_factory=list)
    embeddings: list[EmbeddingRecord] = Field(default_factory=list)
    activities: ActivityPlan


class GeneratedStoryBundle(ContractModel):
    schema_version: Literal["1.0"] = "1.0"
    generation_job_id: str
    learner_id: str
    selected_topic: SelectedTopic
    storyline: StorylineDraft
    activities: ActivityPlan
    media_plan: MediaPlan
    video_decision: VideoDecision
    assets: list[AssetReference]
    embeddings: list[EmbeddingRecord]
    created_at: datetime


class ValidationIssue(ContractModel):
    code: str = Field(pattern=r"^[A-Z][A-Z0-9_]{2,79}$")
    severity: ValidationSeverity
    component: RepairComponent
    path: str
    message: str = Field(min_length=10, max_length=800)
    repair_instruction: str = Field(min_length=10, max_length=800)


class ValidationReport(ContractModel):
    is_valid: bool
    quality_score: int = Field(ge=0, le=100)
    issues: list[ValidationIssue] = Field(default_factory=list, max_length=60)
    factual_grounding_summary: str = Field(min_length=20, max_length=1200)
    safety_summary: str = Field(min_length=20, max_length=1200)

    @model_validator(mode="after")
    def validity_matches_errors(self) -> "ValidationReport":
        has_errors = any(
            issue.severity is ValidationSeverity.ERROR for issue in self.issues
        )
        if self.is_valid == has_errors:
            raise ValueError("is_valid must be false exactly when errors exist")
        return self


class RepairResult(ContractModel):
    storyline: StorylineDraft
    activities: ActivityPlan
    media_plan: MediaPlan
    change_notes: list[str] = Field(min_length=1, max_length=20)


class PersistenceReceipt(ContractModel):
    story_id: str
    version: int = Field(ge=1)
    persisted_at: datetime


class StoryGenerationResult(ContractModel):
    job_id: str
    receipt: PersistenceReceipt
    validation: ValidationReport
    repair_cycles: int = Field(ge=0, le=2)


class StoryJobAccepted(ContractModel):
    job_id: str
    state: Literal[JobState.QUEUED] = JobState.QUEUED
    status_url: str


class StoryJobStatus(ContractModel):
    job_id: str
    state: JobState
    stage: str
    progress: float = Field(ge=0, le=1)
    created_at: datetime
    updated_at: datetime
    result: StoryGenerationResult | None = None
    error_code: str | None = None
    error_message: str | None = None


class UploadIntent(ContractModel):
    job_id: str
    asset_key: str
    kind: AssetKind
    content_type: str
    byte_size: int = Field(gt=0)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")


class SignedUpload(ContractModel):
    asset_id: str
    upload_url: HttpUrl
    public_url: HttpUrl
    headers: dict[str, str] = Field(default_factory=dict)
    expires_at: datetime


class BackendStoryWrite(ContractModel):
    idempotency_key: str
    bundle: GeneratedStoryBundle
    validation: ValidationReport


StoryNodeInput = Annotated[
    StoryGenerationRequest,
    Field(description="Input accepted by the root ADK story workflow."),
]
