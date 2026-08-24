from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import Field, HttpUrl, field_validator, model_validator

from app.schemas.base import ContractModel

MIN_TARGET_AGE = 13
MAX_TARGET_AGE = 18
MIN_STORY_MINUTES = 5
MAX_STORY_MINUTES = 20
MAX_IMAGE_ASSETS = 12


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
    domain: str = Field(min_length=2, max_length=80)
    discipline: str = Field(min_length=2, max_length=120)
    topic_tags: list[str] = Field(default_factory=list, max_length=12)

    @field_validator("discipline")
    @classmethod
    def discipline_is_brief(cls, value: str) -> str:
        if len(value.split()) > 2:
            raise ValueError("discipline must contain at most two words")
        return value


class SourceEvidence(ContractModel):
    title: str
    url: HttpUrl
    published_at: datetime | None = None
    excerpt: str = Field(min_length=20, max_length=1200)
    source_name: str | None = None


class OpenLearningImage(ContractModel):
    title: str
    image_url: HttpUrl
    source_page_url: HttpUrl
    source_name: str
    license_name: Literal[
        "Public domain",
        "CC BY 4.0",
        "CC BY-SA 4.0",
        "CC BY 3.0",
        "CC BY-SA 3.0",
        "CC0 1.0",
    ]
    license_url: HttpUrl
    alt_text: str


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
    approach: str | None = None


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
    ] | None = None
    mood: Literal["calm", "tense", "alarm", "insight", "night", "resolve"] | None = None
    beat: str | None = Field(default=None, min_length=2, max_length=32)
    hints: list[str] | None = Field(default=None, min_length=3, max_length=3)
    concept: str | None = None
    probe: str | None = None
    primer: list[ScenePrimer] = Field(default_factory=list, max_length=2)
    trivia: SceneTrivia | None = None
    learning_reference: SceneLearningReference | None = None
    outcome: Literal["success", "partial"] | None = None


class ScenePrimer(ContractModel):
    term: str
    plain: str
    like: str


class SceneTrivia(ContractModel):
    emoji: str
    title: str
    text: str


class SceneLearningReference(OpenLearningImage):
    plain_explanation: str
    why_important: str


class StoryTakeaway(ContractModel):
    concept: str
    field: str
    in_one_line: str
    rule: str
    elsewhere: list[str]
    you_used_it: list[str]


class PreSessionOption(ContractModel):
    id: str
    label: str
    approach: str


class PreSessionQuestion(ContractModel):
    prompt: str
    options: list[PreSessionOption]


class StoryIntro(ContractModel):
    role: str
    text: list[str]
    cta: str


class StoryCharacter(ContractModel):
    name: str
    role: str
    visual_description: str


class StorylineDraft(ContractModel):
    story_id: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{2,79}$")
    title: str = Field(min_length=3, max_length=100)
    tagline: str = Field(min_length=10, max_length=180)
    synopsis: str = Field(min_length=80, max_length=360)
    subject: SubjectRef
    target_age: int = Field(ge=MIN_TARGET_AGE, le=MAX_TARGET_AGE)
    difficulty: Difficulty
    estimated_minutes: int = Field(ge=MIN_STORY_MINUTES, le=MAX_STORY_MINUTES)
    learning_objectives: list[str] = Field(min_length=1, max_length=4)
    opening_scene_id: str
    scenes: list[SceneDraft] = Field(min_length=5, max_length=24)
    takeaway: str = Field(min_length=30, max_length=800)
    citations: list[SourceEvidence] = Field(min_length=1, max_length=12)
    learning_goal: str | None = Field(default=None, min_length=20, max_length=280)
    stage_label: str | None = None
    partner_greeting: str | None = None
    characters: list[StoryCharacter] = Field(default_factory=list, max_length=4)
    intro: StoryIntro | None = None
    pre_session: PreSessionQuestion | None = None
    player_takeaway: StoryTakeaway | None = None


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
    instruction: str | None = None
    wrong: str | None = None
    right: str | None = None


class SimulationControl(ContractModel):
    control_id: str
    label: str
    minimum: float
    maximum: float
    step: float = Field(gt=0)
    initial: float
    unit: str = ""

    @model_validator(mode="after")
    def values_are_in_range(self) -> SimulationControl:
        if self.minimum >= self.maximum:
            raise ValueError("simulation minimum must be below maximum")
        if not self.minimum <= self.initial <= self.maximum:
            raise ValueError("simulation initial value must be within its range")
        return self


class SimulationLookupCase(ContractModel):
    when: dict[str, float]
    value: str


class SimulationReadout(ContractModel):
    readout_id: str
    label: str
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
    input_ids: list[str]
    params: dict[str, float] = Field(default_factory=dict)
    cases: list[SimulationLookupCase] = Field(default_factory=list)
    fallback: str = "—"
    success_value: str
    unit: str = ""
    decimals: int = 0


class SimulationSpec(ContractModel):
    prompt: str
    model_kind: str
    controls: list[SimulationControl] = Field(min_length=1, max_length=4)
    observed_variables: list[str] = Field(min_length=1, max_length=6)
    readouts: list[SimulationReadout] = Field(default_factory=list)
    success_condition: str
    explanation: str
    guide: SimulationGuide | None = None


class SimulationGuide(ContractModel):
    shows: str
    move: str
    watch: str


class SliderBand(ContractModel):
    max: float
    text: str


class SliderSpec(ContractModel):
    prompt: str
    label: str
    unit: str = ""
    minimum: float
    maximum: float
    step: float
    initial: float
    target_minimum: float
    target_maximum: float
    readout_label: str
    readout_unit: str = ""
    readout_expr: str
    readout_params: dict[str, float]
    readout_decimals: int
    driver_label: str
    driver_value: float
    driver_unit: str = ""
    driver_expr: Literal["fixed", "part_of_total_percent"] = "fixed"
    driver_params: dict[str, float] = Field(default_factory=dict, max_length=4)
    risk_mode: str
    risk_safe_gap: float
    meter: str
    bands: list[SliderBand]
    explanation: str
    guide: SimulationGuide | None = None


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
    def exactly_one_matching_payload(self) -> ActivitySpec:
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
    style: str = "diegetic footage with no readable text or identifiable people"


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
    def approved_video_has_request(self) -> VideoDecision:
        if self.approved != (self.approved_request is not None):
            raise ValueError("approved video decisions must include a request")
        return self


ALLOWED_MIME_TYPES = {
    AssetKind.IMAGE: {"image/png", "image/jpeg", "image/webp"},
    AssetKind.VIDEO: {"video/mp4"},
    AssetKind.AUDIO: {"audio/wav", "audio/mpeg"},
}


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

    @model_validator(mode="after")
    def mime_type_matches_kind(self) -> AssetReference:
        if self.content_type not in ALLOWED_MIME_TYPES[self.kind]:
            raise ValueError(f"{self.content_type} is not valid for {self.kind}")
        return self


class EmbeddingRecord(ContractModel):
    embedding_id: str
    content_key: str
    content_type: Literal["story", "scene", "activity", "topic"]
    text: str
    vector: list[float] = Field(min_length=1)
    dimensions: int = Field(gt=0)
    model: str

    @model_validator(mode="after")
    def dimensions_match_vector(self) -> EmbeddingRecord:
        if len(self.vector) != self.dimensions:
            raise ValueError("embedding dimensions do not match vector length")
        return self


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
    def validity_matches_errors(self) -> ValidationReport:
        has_errors = any(issue.severity is ValidationSeverity.ERROR for issue in self.issues)
        if self.is_valid == has_errors:
            raise ValueError("is_valid must be false exactly when errors exist")
        return self


class BackendStoryWrite(ContractModel):
    idempotency_key: str = Field(min_length=8, max_length=128)
    bundle: GeneratedStoryBundle
    validation: ValidationReport


class PersistenceReceipt(ContractModel):
    story_id: str
    version: int = Field(ge=1)
    persisted_at: datetime


class GeneratedStorySummary(ContractModel):
    story_id: str
    version: int = Field(ge=1)
    title: str
    subject: SubjectRef
    difficulty: Difficulty
    estimated_minutes: int = Field(ge=MIN_STORY_MINUTES, le=MAX_STORY_MINUTES)


class GeneratedStoryRead(ContractModel):
    story_id: str
    version: int = Field(ge=1)
    bundle: GeneratedStoryBundle
    validation: ValidationReport
    media_urls: dict[str, HttpUrl]
