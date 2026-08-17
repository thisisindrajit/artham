import {
  emptyNotes,
  getScenario,
  getScene,
  type ApproachTag,
  type ChoiceScene,
  type ReorderScene,
  type Scenario,
  type Scene,
  type SessionNotes,
  type SliderScene,
} from "../story";
import { bandFor, isSliderCorrect, readoutFor } from "./formulas";

export type Phase = "intro" | "presession" | "scene" | "profile";

/** A beat the story engine finished, offered to the partner for interpretation. */
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
  /**
   * Beats the learner has actually lived through, oldest first, no repeats.
   * Feeds the "story so far" recap, so it records scenes on arrival rather
   * than on completion.
   */
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

export function initState(scenarioId: string): PlayState {
  const scenario = requireScenario(scenarioId);
  return {
    scenarioId,
    phase: "intro",
    sceneId: scenario.startScene,
    tried: {},
    hintLevel: {},
    commits: {},
    pending: null,
    visited: [scenario.startScene],
    notes: emptyNotes(scenarioId),
  };
}

function requireScenario(id: string): Scenario {
  const scenario = getScenario(id);
  if (!scenario) throw new Error(`Unknown scenario "${id}"`);
  return scenario;
}

export function currentScene(state: PlayState): Scene {
  return getScene(requireScenario(state.scenarioId), state.sceneId);
}

/**
 * Pure. Never throws for user input; unknown actions return state unchanged.
 *
 * Wraps the transition table so that every scene the learner lands on is
 * recorded exactly once, wherever the jump came from. Doing it here rather
 * than at each `sceneId:` assignment means a new branch cannot forget to.
 */
export function step(state: PlayState, action: Action): StepResult {
  const result = transition(state, action);
  const { sceneId, visited } = result.state;
  if (visited.includes(sceneId)) return result;
  return { ...result, state: { ...result.state, visited: [...visited, sceneId] } };
}

function transition(state: PlayState, action: Action): StepResult {
  const scenario = requireScenario(state.scenarioId);
  const scene = getScene(scenario, state.sceneId);
  const notes = cloneNotes(state.notes);

  switch (action.type) {
    case "begin":
      return { state: { ...state, phase: "presession" }, event: null };

    case "presession": {
      notes.preSessionAnswer = {
        question: action.question,
        answer: action.answer,
        approach: action.approach,
      };
      return {
        state: { ...state, phase: "scene", notes },
        event: null,
      };
    }

    case "advance": {
      if (state.pending) {
        return {
          state: {
            ...state,
            sceneId: state.pending.nextSceneId,
            pending: null,
          },
          event: null,
        };
      }
      if (scene.type === "narrative" || scene.type === "reflect") {
        return { state: { ...state, sceneId: scene.next }, event: null };
      }
      if (scene.type === "ending") {
        return { state: { ...state, phase: "profile" }, event: null };
      }
      return { state, event: null };
    }

    case "choose": {
      if (scene.type !== "choice" || state.pending) return { state, event: null };
      const option = scene.options.find((o) => o.id === action.optionId);
      if (!option) return { state, event: null };

      const priorWrong = state.tried[scene.id] ?? [];
      const attempt = priorWrong.length + 1;

      notes.decisions.push({
        sceneId: scene.id,
        choice: option.label,
        correct: option.correct,
        outcome: option.correct
          ? option.outcome
          : scene.consequences[option.id],
        attempt,
        approach: option.approach,
        at: Date.now(),
      });

      if (!option.correct) {
        notes.mistakes.push({
          sceneId: scene.id,
          mistake: option.label,
          corrected: false,
        });
        const next: PlayState = {
          ...state,
          tried: {
            ...state.tried,
            [scene.id]: dedupe([...priorWrong, option.id]),
          },
          pending: {
            text: scene.consequences[option.id] ?? "That doesn't hold up.",
            correct: false,
            nextSceneId: option.next,
          },
          notes,
        };
        return {
          state: next,
          event: {
            kind: "mistake",
            sceneId: scene.id,
            attempt,
            concept: scene.concept,
            what: `Chose "${option.label}" on: ${scene.prompt}`,
            hint: hintAt(scene, attempt - 1),
          },
        };
      }

      const recovered = priorWrong.length > 0;
      if (recovered) {
        for (const m of notes.mistakes) {
          if (m.sceneId === scene.id) m.corrected = true;
        }
        notes.selfCorrections += 1;
      }

      // Show what the decision actually did before moving the story on, so a
      // right answer is narrated at least as well as a wrong one.
      const next: PlayState = option.outcome
        ? {
            ...state,
            pending: {
              text: option.outcome,
              correct: true,
              nextSceneId: option.next,
            },
            notes,
          }
        : { ...state, sceneId: option.next, notes };

      if (recovered) {
        return {
          state: next,
          event: {
            kind: "self_correction",
            sceneId: scene.id,
            concept: scene.concept,
            what: `Reached "${option.label}" after ${priorWrong.length} wrong attempt(s) on: ${scene.prompt}`,
            attempts: attempt,
          },
        };
      }
      if (scene.probe) {
        return {
          state: next,
          event: {
            kind: "key_decision",
            sceneId: scene.id,
            concept: scene.concept,
            what: `Chose "${option.label}" first try on: ${scene.prompt}`,
            probe: scene.probe,
          },
        };
      }
      return { state: next, event: null };
    }

    case "commit": {
      if (scene.type !== "slider" || state.pending) return { state, event: null };
      const value = clamp(action.value, scene.slider.min, scene.slider.max);
      const correct = isSliderCorrect(scene, value);
      const prior = state.commits[scene.id] ?? [];
      const values = [...prior, value];
      const outcome = bandFor(scene, value);

      notes.experiments.push({
        sceneId: scene.id,
        value,
        correct,
        outcome,
      });
      if (!correct) {
        notes.mistakes.push({
          sceneId: scene.id,
          mistake: `Set ${scene.slider.label} to ${value}${scene.slider.unit} — ${scene.readout.label} ${readoutFor(
            scene,
            value,
          ).toFixed(scene.readout.decimals)}${scene.readout.unit}`,
          corrected: false,
        });
      } else if (prior.length > 0) {
        for (const m of notes.mistakes) {
          if (m.sceneId === scene.id) m.corrected = true;
        }
        notes.selfCorrections += 1;
      }

      const next: PlayState = {
        ...state,
        commits: { ...state.commits, [scene.id]: values },
        pending: {
          text: outcome,
          correct,
          nextSceneId: correct ? scene.next : scene.id,
        },
        notes,
      };

      if (!correct) {
        return {
          state: next,
          event: {
            kind: "mistake",
            sceneId: scene.id,
            attempt: values.length,
            concept: scene.concept,
            what: `Committed ${value}${scene.slider.unit}, giving ${scene.readout.label} of ${readoutFor(
              scene,
              value,
            ).toFixed(scene.readout.decimals)}${scene.readout.unit} against a ${scene.driver.label} of ${scene.driver.value}${scene.driver.unit}`,
            hint: hintAt(scene, values.length - 1),
          },
        };
      }

      return {
        state: next,
        event: {
          kind: "experiment",
          sceneId: scene.id,
          concept: scene.concept,
          what: describeExperiments(scene, values),
          values,
        },
      };
    }

    case "reorder": {
      if (scene.type !== "reorder" || state.pending) {
        return { state, event: null };
      }
      const answer = sanitiseOrder(scene, action.order);
      if (!answer) return { state, event: null };

      const solution = scene.steps.map((s) => s.id);
      const correct = answer.every((id, i) => id === solution[i]);
      const priorWrong = state.tried[scene.id] ?? [];
      const attempt = priorWrong.length + 1;
      const trail = describeOrder(scene, answer);

      notes.decisions.push({
        sceneId: scene.id,
        choice: trail,
        correct,
        outcome: correct ? scene.right : scene.wrong,
        attempt,
        at: Date.now(),
      });

      if (!correct) {
        notes.mistakes.push({
          sceneId: scene.id,
          mistake: `Ordered: ${trail}`,
          corrected: false,
        });
        return {
          state: {
            ...state,
            tried: {
              ...state.tried,
              [scene.id]: dedupe([...priorWrong, answer.join(">")]),
            },
            pending: { text: scene.wrong, correct: false, nextSceneId: scene.id },
            notes,
          },
          event: {
            kind: "mistake",
            sceneId: scene.id,
            attempt,
            concept: scene.concept,
            what: `Ordered "${trail}" on: ${scene.prompt}`,
            hint: hintAt(scene, attempt - 1),
          },
        };
      }

      const recovered = priorWrong.length > 0;
      if (recovered) {
        for (const m of notes.mistakes) {
          if (m.sceneId === scene.id) m.corrected = true;
        }
        notes.selfCorrections += 1;
      }

      const next: PlayState = {
        ...state,
        pending: { text: scene.right, correct: true, nextSceneId: scene.next },
        notes,
      };

      if (recovered) {
        return {
          state: next,
          event: {
            kind: "self_correction",
            sceneId: scene.id,
            concept: scene.concept,
            what: `Reached the right order after ${priorWrong.length} wrong attempt(s) on: ${scene.prompt}`,
            attempts: attempt,
          },
        };
      }
      if (scene.probe) {
        return {
          state: next,
          event: {
            kind: "key_decision",
            sceneId: scene.id,
            concept: scene.concept,
            what: `Ordered the steps correctly first try: ${trail}`,
            probe: scene.probe,
          },
        };
      }
      return { state: next, event: null };
    }

    case "reflect": {
      if (scene.type !== "reflect") return { state, event: null };
      const answer = action.answer.trim();
      if (answer) {
        notes.reasoningSamples.push({
          sceneId: scene.id,
          question: scene.prompt,
          answer,
        });
      }
      const next: PlayState = { ...state, sceneId: scene.next, notes };
      if (!answer) return { state: next, event: null };
      return {
        state: next,
        event: {
          kind: "reasoning",
          sceneId: scene.id,
          question: scene.prompt,
          answer,
        },
      };
    }

    case "reasoning": {
      const answer = action.answer.trim();
      if (!answer) return { state, event: null };
      notes.reasoningSamples.push({
        sceneId: state.sceneId,
        question: action.question,
        answer,
      });
      return {
        state: { ...state, notes },
        event: {
          kind: "reasoning",
          sceneId: state.sceneId,
          question: action.question,
          answer,
        },
      };
    }

    case "help": {
      if (
        scene.type !== "choice" &&
        scene.type !== "slider" &&
        scene.type !== "reorder"
      ) {
        return { state, event: null };
      }
      const level = Math.min((state.hintLevel[scene.id] ?? 0) + 1, 3);
      notes.hintsUsed += 1;
      notes.helpRequests += 1;
      return {
        state: {
          ...state,
          hintLevel: { ...state.hintLevel, [scene.id]: level },
          notes,
        },
        event: {
          kind: "help_request",
          sceneId: scene.id,
          concept: scene.concept,
          what: describeSituation(scene),
          hint: hintAt(scene, level - 1),
          level,
        },
      };
    }
  }
}

/* -------------------- partner call policy -------------------- */

/** Keeps a session inside the 3–8 call budget the product depends on. */
export const IN_SESSION_CALL_BUDGET = 6;

export function shouldConsultPartner(
  event: EngineEvent,
  callsUsed: number,
): boolean {
  if (callsUsed >= IN_SESSION_CALL_BUDGET) return false;
  switch (event.kind) {
    // Always worth a call: the learner is stuck, asking, or explaining.
    case "mistake":
    case "help_request":
    case "reasoning":
      return true;
    case "self_correction":
      return true;
    // Only interesting once the learner has actually iterated.
    case "experiment":
      return event.values.length >= 2;
    // A clean first-try answer only earns a call early, when a probe is cheap.
    case "key_decision":
      return callsUsed < 3;
  }
}

/* -------------------- helpers -------------------- */

type HintedScene = ChoiceScene | SliderScene | ReorderScene;

function hintAt(scene: HintedScene, index: number): string {
  return scene.hints[Math.min(Math.max(index, 0), scene.hints.length - 1)];
}

function describeSituation(scene: HintedScene): string {
  switch (scene.type) {
    case "choice":
      return `Stuck on: ${scene.prompt}`;
    case "reorder":
      return `Stuck ordering ${scene.steps.length} steps on: ${scene.prompt}`;
    case "slider":
      return `Stuck on: ${scene.prompt} (${scene.slider.label}, ${scene.slider.min}–${scene.slider.max}${scene.slider.unit})`;
  }
}

/** Accepts an order only if it is a permutation of the scene's own steps. */
function sanitiseOrder(scene: ReorderScene, order: string[]): string[] | null {
  if (order.length !== scene.steps.length) return null;
  const ids = new Set(scene.steps.map((s) => s.id));
  const seen = new Set<string>();
  for (const id of order) {
    if (!ids.has(id) || seen.has(id)) return null;
    seen.add(id);
  }
  return order;
}

function describeOrder(scene: ReorderScene, order: string[]): string {
  return order
    .map((id) => scene.steps.find((s) => s.id === id)?.label ?? id)
    .join(" → ");
}

function describeExperiments(scene: SliderScene, values: number[]): string {
  const trail = values
    .map(
      (v) =>
        `${v}${scene.slider.unit}→${readoutFor(scene, v).toFixed(
          scene.readout.decimals,
        )}${scene.readout.unit}`,
    )
    .join(", ");
  return `Settled on ${values[values.length - 1]}${scene.slider.unit} after ${values.length} attempt(s): ${trail}`;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function cloneNotes(notes: SessionNotes): SessionNotes {
  return {
    ...notes,
    observations: [...notes.observations],
    mistakes: notes.mistakes.map((m) => ({ ...m })),
    decisions: [...notes.decisions],
    reasoningSamples: [...notes.reasoningSamples],
    experiments: [...notes.experiments],
  };
}
