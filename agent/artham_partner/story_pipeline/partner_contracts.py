"""Wire contracts for the live Artham thinking engine."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


class PartnerModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        extra="forbid",
    )


class ActivityBeat(PartnerModel):
    position: int
    scene_id: str
    beat: str
    activity: str


class ScenarioContext(PartnerModel):
    id: str
    title: str
    domain: str
    learning_goal: str
    role: str
    greeting: str
    activity_sequence: list[ActivityBeat]


class PreludeOption(PartnerModel):
    id: str
    label: str
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


class PreludeQuestion(PartnerModel):
    prompt: str
    placeholder: str = "Share what you would try first..."
    options: list[PreludeOption] = Field(default_factory=list, max_length=4)


class PreludeRequest(PartnerModel):
    scenario: ScenarioContext
    intro: list[str]
    fallback_question: PreludeQuestion


class PreludeOutput(PartnerModel):
    greeting: str
    question: PreludeQuestion


class ThinkingObservation(PartnerModel):
    category: Literal[
        "strategy",
        "mistake",
        "reasoning",
        "adaptation",
        "help_seeking",
        "decision_pattern",
    ]
    observation: str
    evidence: str
    confidence: float = Field(ge=0, le=1)
    scene_id: str


class NotesDigest(PartnerModel):
    pre_session_answer: str | None = None
    decisions: list[dict[str, Any]]
    mistakes: list[dict[str, Any]]
    experiments: list[dict[str, Any]]
    reasoning: list[dict[str, Any]]
    observations: list[ThinkingObservation]
    hints_used: int
    self_corrections: int
    help_requests: int


class ObserveRequest(PartnerModel):
    scenario: ScenarioContext
    event: dict[str, Any]
    notes: NotesDigest
    fallback_hint: str


class ObserveOutput(PartnerModel):
    action: Literal["observe", "ask", "guide", "encourage", "none"]
    message: str
    ask_for: str | None = None
    observation: ThinkingObservation | None = None


class ProfileRequest(PartnerModel):
    scenario: ScenarioContext
    notes: NotesDigest
    outcome: Literal["success", "partial"]


class ProfileEvidence(PartnerModel):
    title: str
    evidence: str


class ProfileDetail(PartnerModel):
    title: str
    observation: str
    evidence: str


class ProfileOutput(PartnerModel):
    archetype: str
    score: int = Field(ge=0, le=100)
    summary: str
    strength: ProfileEvidence
    blind_spot: ProfileEvidence
    noticed: str
    details: list[ProfileDetail] = Field(min_length=3, max_length=4)
    try_next: str
