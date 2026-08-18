import type {
  ApproachTag,
  ChoiceScene,
  ReorderScene,
  SessionNotes,
  SliderScene,
} from "@/types/story";

export type Phase = "intro" | "presession" | "scene" | "profile";

/** A completed story beat offered to the partner for interpretation. */
export type EngineEvent =
  | {
      kind: "mistake";
      sceneId: string;
      attempt: number;
      concept: string;
      what: string;
      hint: string;
    }
  | {
      kind: "self_correction";
      sceneId: string;
      concept: string;
      what: string;
      attempts: number;
    }
  | {
      kind: "help_request";
      sceneId: string;
      concept: string;
      what: string;
      hint: string;
      level: number;
    }
  | {
      kind: "key_decision";
      sceneId: string;
      concept: string;
      what: string;
      probe: string;
    }
  | {
      kind: "experiment";
      sceneId: string;
      concept: string;
      what: string;
      values: number[];
    }
  | { kind: "reasoning"; sceneId: string; question: string; answer: string };

export interface Pending {
  text: string;
  correct: boolean;
  nextSceneId: string;
}

export interface PlayState {
  scenarioId: string;
  phase: Phase;
  sceneId: string;
  /** Wrong option ids already attempted, per scene. */
  tried: Record<string, string[]>;
  /** Hints revealed so far, per scene. Caps at 3. */
  hintLevel: Record<string, number>;
  /** Slider values committed, per scene, in order. */
  commits: Record<string, number[]>;
  /** Consequence or result blocking the scene until acknowledged. */
  pending: Pending | null;
  /** Beats the learner has lived through, oldest first, without repeats. */
  visited: string[];
  notes: SessionNotes;
}

export type Action =
  | { type: "begin" }
  | {
      type: "presession";
      question: string;
      answer: string;
      approach?: ApproachTag;
    }
  | { type: "advance" }
  | { type: "choose"; optionId: string }
  | { type: "commit"; value: number }
  | { type: "reorder"; order: string[] }
  | { type: "reflect"; answer: string }
  | { type: "help" }
  | { type: "reasoning"; question: string; answer: string };

export interface StepResult {
  state: PlayState;
  event: EngineEvent | null;
}

export type HintedScene = ChoiceScene | SliderScene | ReorderScene;
