"""Strict data contracts shared by every story-generation stage."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Any, Literal

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

    # Broad catalog category, e.g. "science" or "history".
    domain: str = Field(min_length=2, max_length=80)
    # Parent topic shown on story cards, e.g. "supernovae" or "Silk Route".
    discipline: str = Field(min_length=2, max_length=120)
    # Optional narrower concepts beneath the parent topic.
    topic_tags: list[str] = Field(default_factory=list, max_length=12)

    @field_validator("discipline")
    @classmethod
    def discipline_is_brief(cls, value: str) -> str:
        words = [part for part in value.split() if any(char.isalnum() for char in part)]
        if len(words) > 4:
            raise ValueError("discipline must contain at most four content words")
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
    max_images: int = Field(default=1, ge=0, le=MAX_IMAGE_ASSETS)
    generate_cover_image: bool = True
    video: VideoBudget = Field(default_factory=VideoBudget)
    generate_background_audio: bool = True

    @model_validator(mode="after")
    def cover_requires_an_image_slot(self) -> "MediaBudget":
        if self.generate_cover_image and self.max_images < 1:
            raise ValueError("cover generation requires at least one image slot")
        return self


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
    # Free-form natural-language description of the exact story to generate
    # (setting, plot, characters, tone). When supplied, this is the
    # authoritative creative brief: it takes priority over interpreting
    # preferred_subjects.topic_tags as keyword hints. Optional -- structured
    # subject/topic fields alone remain sufficient without it.
    story_brief: str | None = Field(default=None, min_length=10, max_length=1500)


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
        "CC BY 2.5",
        "CC BY-SA 2.5",
        "CC BY 2.0",
        "CC BY-SA 2.0",
        "CC0 1.0",
    ]
    license_url: HttpUrl
    alt_text: str = Field(min_length=12, max_length=300)
    # Internal-only: raw source-page text used to author plain_explanation.
    # Never sent to the backend (not part of its persistence contract).
    page_summary: str | None = Field(default=None, max_length=600, exclude=True)


class ResearchCorpus(ContractModel):
    query: str
    sources: list[SourceEvidence] = Field(min_length=3, max_length=30)


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
    beat: str = Field(min_length=2, max_length=160)
    hints: list[str] | None = Field(default=None, min_length=3, max_length=3)
    concept: str | None = None
    probe: str | None = None
    primer: list["ScenePrimer"] = Field(default_factory=list, max_length=2)
    trivia: "SceneTrivia | None" = None
    learning_reference: "SceneLearningReference | None" = None
    outcome: Literal["success", "partial"] | None = None
    # 1-based indices into StorylineDraft.citations identifying which supplied
    # sources this scene's narrative facts are drawn from. Optional -- left
    # empty when no specific source backs the scene's content.
    citation_refs: list[int] = Field(default_factory=list, max_length=3)
    # A specific, concrete, real-world named thing this scene's narrative
    # actually mentions (a molecule, artifact, instrument, building, species,
    # place) that a real photo would help a learner picture -- never the
    # story's whole topic. Filled by the scene worker itself since only it
    # knows the exact concrete nouns used in the prose; the orchestrator later
    # searches for a real, openly licensed photo of this specific subject.
    reference_subject: str | None = Field(default=None, max_length=80)
    reference_fact: str | None = Field(default=None, min_length=30, max_length=360)
    reference_fact_citation_refs: list[int] = Field(default_factory=list, max_length=3)


class ScenePrimer(ContractModel):
    term: str = Field(min_length=2, max_length=80)
    plain: str = Field(min_length=20, max_length=320)
    like: str = Field(min_length=12, max_length=240)


class SceneTrivia(ContractModel):
    emoji: str = Field(min_length=1, max_length=8)
    title: str = Field(min_length=4, max_length=80)
    text: str = Field(min_length=20, max_length=320)
    # 1-based indices into StorylineDraft.citations backing this specific
    # "did you know" fact, distinct from the scene's own citation_refs.
    citation_refs: list[int] = Field(default_factory=list, max_length=3)


class SceneLearningReference(OpenLearningImage):
    plain_explanation: str = Field(min_length=30, max_length=420)
    why_important: str = Field(min_length=30, max_length=360)
    citation_refs: list[int] = Field(default_factory=list, max_length=3)


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
    placeholder: str = Field(
        default="Share what you would try first...",
        min_length=8,
        max_length=140,
    )
    options: list[PreSessionOption] = Field(default_factory=list, max_length=4)


class StoryIntro(ContractModel):
    role: str = Field(min_length=3, max_length=100)
    text: list[str] = Field(min_length=1, max_length=4)
    cta: str = Field(min_length=4, max_length=60)


class StoryCharacter(ContractModel):
    name: str = Field(min_length=2, max_length=60)
    role: str = Field(min_length=3, max_length=100)
    visual_description: str = Field(min_length=20, max_length=300)


class SceneSpec(ContractModel):
    """Compact architect output expanded by one scene worker."""

    scene_id: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{1,63}$")
    position: int = Field(ge=0)
    act: Literal[1, 2, 3]
    title: str
    beat: str
    narrative_goal: str
    learning_purpose: str
    required_facts: list[str]
    character_names: list[str]
    interaction_slot: ActivityKind | None = None
    next_scene_id: str | None = None
    scene_type: Literal[
        "narrative", "choice", "slider", "reorder", "reflect", "ending"
    ]
    mood: Literal["calm", "tense", "alarm", "insight", "night", "resolve"]
    concept: str | None = None
    include_primer: bool = False
    include_trivia: bool = False
    trivia_fact: str | None = None
    # Planned centrally so parallel scene workers cannot all pick the same
    # subject and lose every duplicate to deduplication.
    reference_subject: str | None = Field(default=None, max_length=80)
    outcome: Literal["success", "partial"] | None = None

    @model_validator(mode="after")
    def trivia_is_planned(self) -> "SceneSpec":
        if self.include_trivia != bool(self.trivia_fact):
            raise ValueError(
                "include_trivia and trivia_fact must be present together"
            )
        return self


class StoryBlueprint(ContractModel):
    """Whole-story reasoning without learner-facing scene prose."""

    story_id: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{2,79}$")
    title: str
    tagline: str
    synopsis: str
    subject: SubjectRef
    target_age: int
    difficulty: Difficulty
    estimated_minutes: int
    learning_objectives: list[str]
    opening_scene_id: str
    takeaway: str
    citations: list[SourceEvidence]
    learning_goal: str
    stage_label: str
    partner_greeting: str
    characters: list[StoryCharacter]
    intro: StoryIntro
    pre_session: PreSessionQuestion
    player_takeaway: StoryTakeaway
    continuity_bible: str
    scenes: list[SceneSpec] = Field(min_length=5, max_length=8)

    @model_validator(mode="after")
    def scene_graph_is_ordered(self) -> "StoryBlueprint":
        ordered = sorted(self.scenes, key=lambda item: item.position)
        if ordered != self.scenes:
            raise ValueError("blueprint scenes must be ordered by position")
        ids = [scene.scene_id for scene in self.scenes]
        if len(ids) != len(set(ids)):
            raise ValueError("blueprint scene ids must be unique")
        if not ids or self.opening_scene_id != ids[0]:
            raise ValueError("opening_scene_id must identify the first scene")
        expected_next = [*ids[1:], None]
        if [scene.next_scene_id for scene in self.scenes] != expected_next:
            raise ValueError("blueprint scenes must form one ordered path")
        if self.scenes[-1].scene_type != "ending":
            raise ValueError("the final blueprint scene must be the ending")
        interaction_kinds = {
            scene.interaction_slot
            for scene in self.scenes
            if scene.interaction_slot is not None
        }
        if ActivityKind.QUIZ not in interaction_kinds:
            raise ValueError("every blueprint must include at least one quiz")
        if ActivityKind.SIMULATION not in interaction_kinds:
            raise ValueError("every blueprint must include at least one simulation")
        return self


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
    description: str = ""
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
    when: dict[str, float]
    value: str


class SimulationReadout(ContractModel):
    readout_id: str = Field(pattern=r"^[a-z][a-z0-9_]{1,63}$")
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
    model_kind: str = Field(
        description="Frontend renderer identifier, never executable code."
    )
    controls: list[SimulationControl]
    observed_variables: list[str]
    readouts: list[SimulationReadout] = Field(default_factory=list)
    success_condition: str = Field(
        description="A declarative condition consumed by a trusted renderer."
    )
    explanation: str
    guide: "SimulationGuide | None" = None


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
    description: str = Field(
        default="",
        description="What moving this slider changes and why it matters."
    )
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
    readout_decimals: int
    driver_label: str
    driver_value: float
    driver_unit: str = ""
    driver_expr: Literal["fixed", "part_of_total_percent"] = "fixed"
    driver_params: dict[str, float] = Field(default_factory=dict)
    risk_mode: Literal["separation", "ceiling"]
    risk_safe_gap: float = Field(gt=0)
    meter: Literal["wave", "thermometer", "market", "crowd", "gauge"]
    bands: list[SliderBand]
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
    evidence_to_notice: list[str]


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
    # 1-based indices into StorylineDraft.citations. Deterministically copied
    # from the parent scene's citation_refs (activities are tied 1:1 to a
    # scene), never authored directly by the activity worker.
    citation_refs: list[int] = Field(default_factory=list, max_length=3)

    @model_validator(mode="before")
    @classmethod
    def discard_extraneous_payloads(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        kind = value.get("kind")
        kind_value = kind.value if isinstance(kind, ActivityKind) else kind
        payload_fields = {item.value for item in ActivityKind}
        if kind_value not in payload_fields or value.get(kind_value) is None:
            return value
        return {
            **value,
            **{
                field: None
                for field in payload_fields
                if field != kind_value
            },
        }

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
    activities: list[ActivitySpec]


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
    learner_feedback: str = Field(
        default="The learner review was not recorded for this older story.",
        min_length=20,
        max_length=1200,
    )
    improvement_priorities: list[str] = Field(
        default_factory=lambda: ["Keep the story clear and focused."],
        min_length=1,
        max_length=6,
    )
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
    # Keep accepting historical jobs created before the retry policy changed.
    repair_cycles: int = Field(ge=0, le=2)
    metadata: "GenerationMetadata" = Field(default_factory=lambda: GenerationMetadata())


class TokenUsage(ContractModel):
    input_tokens: int = Field(default=0, ge=0)
    output_tokens: int = Field(default=0, ge=0)
    thoughts_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)


class GenerationMetadata(ContractModel):
    """Provider usage and model details retained with every completed job."""

    usage: TokenUsage = Field(default_factory=TokenUsage)
    usage_by_agent: dict[str, TokenUsage] = Field(default_factory=dict)
    model_versions: list[str] = Field(default_factory=list)


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
    session_id: str | None = None
    invocation_id: str | None = None


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


class JobMediaCleanupResult(ContractModel):
    job_id: str
    deleted_assets: int = Field(ge=0)
    skipped_committed_assets: int = Field(ge=0)


class BackendStoryWrite(ContractModel):
    idempotency_key: str
    bundle: GeneratedStoryBundle
    validation: ValidationReport


StoryNodeInput = Annotated[
    StoryGenerationRequest,
    Field(description="Input accepted by the root ADK story workflow."),
]
