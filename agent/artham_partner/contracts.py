"""Structured contracts for the Artham partner agent.

These mirror `lib/partner/types.ts` on the Next.js side. Every agent uses one
of the Output models as its ADK `output_schema`, so the model is constrained to
emit JSON the frontend can render without parsing prose.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ApproachTag = Literal[
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

ObservationCategory = Literal[
    "strategy",
    "mistake",
    "reasoning",
    "adaptation",
    "help_seeking",
    "decision_pattern",
]

PartnerAction = Literal["observe", "ask", "guide", "encourage", "none"]


class ScenarioContext(BaseModel):
    id: str
    title: str
    domain: str
    learningGoal: str
    role: str


class QuestionOption(BaseModel):
    id: str
    label: str = Field(description="Under 60 characters. No trailing period.")
    approach: ApproachTag


class PreSessionQuestion(BaseModel):
    prompt: str
    options: list[QuestionOption]


class Observation(BaseModel):
    category: ObservationCategory
    observation: str = Field(
        description="A claim about how this learner works, in one sentence."
    )
    evidence: str = Field(
        description="The specific thing they did that supports the claim. Quote "
        "the actual decision or value. Never generalise beyond it."
    )
    confidence: float = Field(ge=0.0, le=1.0)
    sceneId: str


# --------------------------- requests ---------------------------


class PreludeRequest(BaseModel):
    scenario: ScenarioContext
    intro: list[str]
    fallbackQuestion: PreSessionQuestion


class NotesDigest(BaseModel):
    preSessionAnswer: str | None = None
    decisions: list[dict] = Field(default_factory=list)
    mistakes: list[dict] = Field(default_factory=list)
    experiments: list[dict] = Field(default_factory=list)
    reasoning: list[dict] = Field(default_factory=list)
    observations: list[dict] = Field(default_factory=list)
    hintsUsed: int = 0
    selfCorrections: int = 0
    helpRequests: int = 0


class ObserveRequest(BaseModel):
    scenario: ScenarioContext
    event: dict
    notes: NotesDigest
    fallbackHint: str


class ProfileRequest(BaseModel):
    scenario: ScenarioContext
    notes: NotesDigest
    outcome: Literal["success", "partial"]


# --------------------------- outputs ---------------------------


class PreludeOutput(BaseModel):
    greeting: str = Field(
        description="Two sentences at most, in the voice of a partner who will "
        "be watching how the learner thinks. Never say you will grade them."
    )
    question: PreSessionQuestion


class ObserveOutput(BaseModel):
    action: PartnerAction
    message: str = Field(
        description="One or two sentences, spoken to the learner. Never reveal "
        "the answer unless the supplied hint already does."
    )
    askFor: str | None = Field(
        default=None,
        description="Set only when action is 'ask'. The question to put in the "
        "learner's answer box.",
    )
    observation: Observation | None = None


class ProfileSection(BaseModel):
    title: str
    evidence: str


class ProfileOutput(BaseModel):
    archetype: str = Field(
        description="Two words, title case. E.g. 'Systematic Experimenter'."
    )
    score: int = Field(ge=0, le=100)
    summary: str = Field(description="One sentence, addressed as 'You'.")
    strength: ProfileSection
    blindSpot: ProfileSection
    noticed: str = Field(
        description="What changed about the learner during the session, with "
        "the specific moment that showed it."
    )
    tryNext: str = Field(
        description="One sentence describing a scenario that would pressure "
        "their blind spot."
    )
