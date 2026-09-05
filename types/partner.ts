import type {
  ApproachTag,
  ThinkingObservation,
} from "@/types/story";
import type { EngineEvent } from "@/types/engine";

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
  /** Ordered story beats so the model can interpret evidence as progression. */
  activitySequence: {
    position: number;
    sceneId: string;
    beat: string;
    activity: string;
  }[];
}

export interface PreludeRequest {
  scenario: ScenarioContext;
  intro: string[];
  fallbackQuestion: {
    prompt: string;
    placeholder?: string;
    options: { id: string; label: string; approach: ApproachTag }[];
  };
}

export interface PreludeResponse {
  greeting: string;
  question: {
    prompt: string;
    placeholder?: string;
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
  details: Array<{
    title: string;
    observation: string;
    evidence: string;
  }>;
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

export interface PartnerStats {
  decisions: number;
  firstTryCorrect: number;
  selfCorrections: number;
  hintsUsed: number;
}

export interface ThinkingArchetype {
  name: string;
  score: number;
  summary: string;
  strength: { title: string; evidence: string };
  blindSpot: { title: string; evidence: string };
  tryNext: string;
}
