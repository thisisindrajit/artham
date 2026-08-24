import type { PlayState } from "@/types/engine";
import type { Scene } from "@/types/story";

/** One thing the learner tried on a beat, and what the world did about it. */
export interface BeatAttempt {
  /** What they did, in the words they clicked. Absent for free-text beats. */
  choice?: string;
  /** The authored consequence or band text shown for that attempt. */
  outcome?: string;
  /**
   * `success` and `warning` are the story answering back. `note` is the
   * learner's own writing, which the story never grades — so it may not be
   * dressed as a verdict.
   */
  tone: "success" | "warning" | "note";
}

/**
 * Every attempt made on one beat, oldest first.
 *
 * Read out of `state.notes` rather than kept as a second, parallel history:
 * the notes are already the record the Thinking Profile is written from, so
 * deriving the page from them means what a learner scrolls back through cannot
 * disagree with what Artham says they did.
 */
export function beatAttempts(state: PlayState, scene: Scene): BeatAttempt[] {
  switch (scene.type) {
    case "choice":
    case "reorder":
      return state.notes.decisions
        .filter((decision) => decision.sceneId === scene.id)
        .map((decision) => ({
          choice: decision.choice,
          outcome: decision.outcome,
          tone: decision.correct ? ("success" as const) : ("warning" as const),
        }));

    case "slider":
      return state.notes.experiments
        .filter((experiment) => experiment.sceneId === scene.id)
        .map((experiment) => ({
          choice: `${scene.slider.label} at ${experiment.value}${scene.slider.unit}`,
          outcome: experiment.outcome,
          tone: experiment.correct ? ("success" as const) : ("warning" as const),
        }));

    case "reflect":
      return state.notes.reasoningSamples
        .filter((sample) => sample.sceneId === scene.id)
        .map((sample) => ({
          outcome: sample.answer,
          tone: "note" as const,
        }));

    default:
      return [];
  }
}
