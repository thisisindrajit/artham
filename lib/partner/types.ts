import type {
  ApproachTag,
  SessionNotes,
  ThinkingObservation,
} from "../story/types";
import type { EngineEvent } from "../engine";

/**
 * Wire contract shared by the Next.js route handlers and the Python ADK
 * service. Keep it small and additive — the frontend decides how to render,
 * the agent never touches the UI.
 */

export type PartnerAction = "observe" | "ask" | "guide" | "encourage" | "none";

export interface ScenarioContext {
  id: string;
  title: string;
  domain: string;
  learningGoal: string;
  role: string;
  /** Scenario-flavoured opening line for the deterministic fallback. */
  greeting: string;
}

export interface PreludeRequest {
  scenario: ScenarioContext;
  intro: string[];
  fallbackQuestion: {
    prompt: string;
    options: { id: string; label: string; approach: ApproachTag }[];
  };
}

export interface PreludeResponse {
  greeting: string;
  question: {
    prompt: string;
    options: { id: string; label: string; approach: ApproachTag }[];
  };
  /** True when this came from the deterministic fallback, not the model. */
  fallback: boolean;
}

/** Compact view of the notes — the model never receives the raw store. */
export interface NotesDigest {
  preSessionAnswer?: string;
  decisions: {
    scene: string;
    choice: string;
    correct: boolean;
    attempt: number;
    approach?: ApproachTag;
  }[];
  mistakes: { scene: string; mistake: string; corrected: boolean }[];
  experiments: { scene: string; value: number; correct: boolean }[];
  reasoning: { question: string; answer: string }[];
  observations: ThinkingObservation[];
  hintsUsed: number;
  selfCorrections: number;
  helpRequests: number;
}

export interface ObserveRequest {
  scenario: ScenarioContext;
  event: EngineEvent;
  notes: NotesDigest;
  /** Story-authored hint for this beat. The agent may not exceed its level. */
  fallbackHint: string;
}

export interface ObserveResponse {
  action: PartnerAction;
  message: string;
  /** When set, the UI renders a one-line answer box under the message. */
  askFor?: string;
  observation?: ThinkingObservation;
  fallback: boolean;
}

export interface ThinkingProfile {
  archetype: string;
  /** 0–100, how strongly the evidence supports the archetype. */
  score: number;
  summary: string;
  strength: { title: string; evidence: string };
  blindSpot: { title: string; evidence: string };
  noticed: string;
  tryNext: string;
  stats: {
    decisions: number;
    firstTryCorrect: number;
    selfCorrections: number;
    hintsUsed: number;
  };
  fallback: boolean;
}

export interface ProfileRequest {
  scenario: ScenarioContext;
  notes: NotesDigest;
  outcome: "success" | "partial";
}

export function digest(notes: SessionNotes): NotesDigest {
  return {
    preSessionAnswer: notes.preSessionAnswer
      ? `${notes.preSessionAnswer.question} → ${notes.preSessionAnswer.answer}`
      : undefined,
    decisions: notes.decisions.map((d) => ({
      scene: d.sceneId,
      choice: d.choice,
      correct: d.correct,
      attempt: d.attempt,
      approach: d.approach,
    })),
    mistakes: notes.mistakes.map((m) => ({
      scene: m.sceneId,
      mistake: m.mistake,
      corrected: m.corrected,
    })),
    experiments: notes.experiments.map((e) => ({
      scene: e.sceneId,
      value: e.value,
      correct: e.correct,
    })),
    reasoning: notes.reasoningSamples.map((r) => ({
      question: r.question,
      answer: r.answer,
    })),
    observations: notes.observations,
    hintsUsed: notes.hintsUsed,
    selfCorrections: notes.selfCorrections,
    helpRequests: notes.helpRequests,
  };
}
