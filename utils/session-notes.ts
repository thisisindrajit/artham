import type { NotesDigest } from "@/types/partner";
import type { SessionNotes } from "@/types/story";

export function emptyNotes(scenarioId: string): SessionNotes {
  return {
    scenarioId,
    startedAt: Date.now(),
    observations: [],
    mistakes: [],
    decisions: [],
    reasoningSamples: [],
    experiments: [],
    hintsUsed: 0,
    selfCorrections: 0,
    helpRequests: 0,
  };
}

export function digestNotes(notes: SessionNotes): NotesDigest {
  return {
    preSessionAnswer: notes.preSessionAnswer
      ? `${notes.preSessionAnswer.question} → ${notes.preSessionAnswer.answer}`
      : undefined,
    decisions: notes.decisions.map((decision) => ({
      scene: decision.sceneId,
      choice: decision.choice,
      correct: decision.correct,
      attempt: decision.attempt,
      approach: decision.approach,
    })),
    mistakes: notes.mistakes.map((mistake) => ({
      scene: mistake.sceneId,
      mistake: mistake.mistake,
      corrected: mistake.corrected,
    })),
    experiments: notes.experiments.map((experiment) => ({
      scene: experiment.sceneId,
      value: experiment.value,
      correct: experiment.correct,
    })),
    reasoning: notes.reasoningSamples.map((sample) => ({
      question: sample.question,
      answer: sample.answer,
    })),
    observations: notes.observations,
    hintsUsed: notes.hintsUsed,
    selfCorrections: notes.selfCorrections,
    helpRequests: notes.helpRequests,
  };
}

/** Most-recent-N cap so a long story doesn't balloon the /profile payload. */
const MAX_DIGEST_ITEMS = 8;

/**
 * Trims a digest's growable arrays to the most recent items before it is sent
 * to the profile call — the model builds a profile from patterns, not a full
 * transcript, so the tail of the session is what matters most.
 */
export function capNotesDigest(digest: NotesDigest): NotesDigest {
  return {
    ...digest,
    decisions: digest.decisions.slice(-MAX_DIGEST_ITEMS),
    mistakes: digest.mistakes.slice(-MAX_DIGEST_ITEMS),
    experiments: digest.experiments.slice(-MAX_DIGEST_ITEMS),
    reasoning: digest.reasoning.slice(-MAX_DIGEST_ITEMS),
    observations: digest.observations.slice(-MAX_DIGEST_ITEMS),
  };
}
