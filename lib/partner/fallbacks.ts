import type { EngineEvent } from "../engine";
import type {
  NotesDigest,
  ObserveResponse,
  PreludeRequest,
  PreludeResponse,
  ProfileRequest,
  ThinkingProfile,
} from "./types";

/**
 * Every partner capability has a deterministic twin. If the model is slow,
 * unreachable, misconfigured or rate-limited, the learner still gets a
 * partner that behaves sensibly — just less specifically.
 */

export function fallbackPrelude(req: PreludeRequest): PreludeResponse {
  return {
    greeting: req.scenario.greeting,
    question: req.fallbackQuestion,
    fallback: true,
  };
}

export function fallbackObserve(
  event: EngineEvent,
  fallbackHint: string,
): ObserveResponse {
  switch (event.kind) {
    case "mistake":
      return {
        action: "guide",
        message:
          event.attempt === 1
            ? `That did not work. ${fallbackHint}`
            : `Try a different approach. ${fallbackHint}`,
        observation: {
          category: "mistake",
          observation:
            event.attempt === 1
              ? "Committed to a first explanation before ruling out alternatives."
              : "Persisted with a similar line of reasoning after it failed once.",
          evidence: event.what,
          confidence: 0.6,
          sceneId: event.sceneId,
        },
        fallback: true,
      };

    case "help_request":
      return {
        action: "guide",
        message: fallbackHint,
        observation: {
          category: "help_seeking",
          observation: `Asked for help at hint level ${event.level} rather than guessing.`,
          evidence: event.what,
          confidence: 0.7,
          sceneId: event.sceneId,
        },
        fallback: true,
      };

    case "self_correction":
      return {
        action: "encourage",
        message:
          "You changed your idea when the evidence did not support it. That was a useful correction.",
        observation: {
          category: "adaptation",
          observation:
            "Revised approach after a failed attempt rather than repeating it.",
          evidence: event.what,
          confidence: 0.8,
          sceneId: event.sceneId,
        },
        fallback: true,
      };

    case "key_decision":
      return {
        action: "ask",
        message: event.probe,
        askFor: event.probe,
        observation: {
          category: "decision_pattern",
          observation: "Reached the correct decision on the first attempt.",
          evidence: event.what,
          confidence: 0.7,
          sceneId: event.sceneId,
        },
        fallback: true,
      };

    case "experiment":
      return {
        action: "observe",
        message:
          event.values.length > 1
            ? "You adjusted the value and checked the result each time."
            : "You chose one value, and it worked.",
        observation: {
          category: "strategy",
          observation:
            event.values.length > 1
              ? "Iterates toward a target by adjusting and re-checking the readout."
              : "Commits to a computed value without iterating.",
          evidence: event.what,
          confidence: 0.75,
          sceneId: event.sceneId,
        },
        fallback: true,
      };

    case "reasoning":
      return {
        action: "observe",
        message:
          "I noted that. Your explanation helps show how you understood the problem.",
        observation: {
          category: "reasoning",
          observation: "Able to articulate a rationale for the decision.",
          evidence: `Asked "${event.question}" — answered: "${truncate(event.answer, 180)}"`,
          confidence: 0.65,
          sceneId: event.sceneId,
        },
        fallback: true,
      };
  }
}

export function fallbackProfile(req: ProfileRequest): ThinkingProfile {
  const n = req.notes;
  const stats = computeStats(n);
  const archetype = pickArchetype(n, stats);

  return {
    archetype: archetype.name,
    score: archetype.score,
    summary: archetype.summary,
    strength: archetype.strength,
    blindSpot: archetype.blindSpot,
    noticed: buildNoticed(n, stats),
    tryNext: archetype.tryNext,
    stats,
    fallback: true,
  };
}

interface Stats {
  decisions: number;
  firstTryCorrect: number;
  selfCorrections: number;
  hintsUsed: number;
}

function computeStats(n: NotesDigest): Stats {
  // One decision point can hold several attempts. Counting attempts instead of
  // decision points inflates the total *and* the derived "wrong first move"
  // count, so a single retry reads as two bad calls. Key by scene and keep
  // only the first attempt.
  const firstAttempt = new Map<string, boolean>();
  for (const d of n.decisions) {
    if (!firstAttempt.has(d.scene)) firstAttempt.set(d.scene, d.correct);
  }
  return {
    decisions: firstAttempt.size,
    firstTryCorrect: [...firstAttempt.values()].filter(Boolean).length,
    selfCorrections: n.selfCorrections,
    hintsUsed: n.hintsUsed,
  };
}

interface Archetype {
  name: string;
  score: number;
  summary: string;
  strength: { title: string; evidence: string };
  blindSpot: { title: string; evidence: string };
  tryNext: string;
}

function pickArchetype(n: NotesDigest, s: Stats): Archetype {
  const iterated = n.experiments.length >= 2;
  const measuredFirst = n.decisions.some(
    (d) => d.approach === "measure_first" && d.correct && d.attempt === 1,
  );
  const droppedHypothesis = n.decisions.some(
    (d) => d.approach === "abandon_hypothesis" && d.correct,
  );
  const cleanRun =
    s.decisions > 0 && s.firstTryCorrect / s.decisions >= 0.75 && s.hintsUsed === 0;
  // Someone who measured first or iterated didn't pattern-match their way
  // through — they worked it. Keep those two archetypes disjoint.
  const solvedDirectly = cleanRun && !measuredFirst && !iterated;

  if (s.selfCorrections >= 2 || (s.selfCorrections >= 1 && droppedHypothesis)) {
    return {
      name: "Adaptive Corrector",
      score: 78,
      summary:
        "You change your mind when the evidence stops agreeing with you — and you do it fast.",
      strength: {
        title: "You let go of a losing idea",
        evidence: `You abandoned an approach and found a better one ${s.selfCorrections} time${
          s.selfCorrections === 1 ? "" : "s"
        } during this session.`,
      },
      blindSpot: {
        title: "You commit before you check",
        evidence: `Your first move was wrong on ${
          s.decisions - s.firstTryCorrect
        } of ${s.decisions} decisions — the correction was good, but it was a correction.`,
      },
      tryNext:
        "A scenario where the cost of a wrong first move is high and you only get one attempt.",
    };
  }

  if (iterated || measuredFirst) {
    return {
      name: "Systematic Experimenter",
      score: 82,
      summary:
        "You get numbers on the table before you touch anything, and you move one thing at a time.",
      strength: {
        title: "Evidence before action",
        evidence: measuredFirst
          ? "You went looking for numbers before you touched anything, when three faster-looking options were sitting right there."
          : `You adjusted and re-read the instruments ${n.experiments.length} times before committing.`,
      },
      blindSpot: iterated
        ? {
            title: "Slow to commit",
            evidence: `You took ${n.experiments.length} attempts to settle on a value while the clock was running.`,
          }
        : {
            title: "One reading was enough",
            evidence:
              "You measured before acting, then committed on the first value you tried — the habit of checking got you the data, but you didn't test it against a second case.",
          },
      tryNext:
        "A scenario where the instruments are unreliable and you have to act on a partial reading.",
    };
  }

  if (solvedDirectly) {
    return {
      name: "Direct Solver",
      score: 80,
      summary:
        "You saw the shape of the problem early and went straight at it.",
      strength: {
        title: "Fast pattern recognition",
        evidence: `You got ${s.firstTryCorrect} of ${s.decisions} decisions right on the first attempt without asking for a hint.`,
      },
      blindSpot: {
        title: "Untested confidence",
        evidence:
          "You rarely showed your working, so it's hard to tell which answers were reasoned and which were recognised.",
      },
      tryNext:
        "A scenario where the most obvious answer is a well-disguised trap.",
    };
  }

  if (s.hintsUsed >= 2) {
    return {
      name: "Collaborative Thinker",
      score: 72,
      summary:
        "You'd rather ask a good question than burn attempts guessing.",
      strength: {
        title: "You use the room",
        evidence: `You asked for guidance ${s.hintsUsed} time${
          s.hintsUsed === 1 ? "" : "s"
        } instead of cycling through options at random.`,
      },
      blindSpot: {
        title: "Reaching out early",
        evidence:
          "Some of those hints arrived before you'd fully tested your own read of the situation.",
      },
      tryNext:
        "A scenario with no hints available, to see what your own first instinct produces.",
    };
  }

  return {
    name: "Careful Reasoner",
    score: 70,
    summary:
      "You work the problem steadily and you don't jump to the dramatic explanation.",
    strength: {
      title: "You stay with the evidence",
      evidence: `You reached the right call on ${s.firstTryCorrect} of ${s.decisions} decisions without over-correcting.`,
    },
    blindSpot: {
      title: "Narrow search",
      evidence:
        "You tended to evaluate options in the order presented rather than looking for one that wasn't on the list.",
    },
    tryNext:
      "A scenario where the correct move isn't one of the offered options.",
  };
}

function buildNoticed(n: NotesDigest, s: Stats): string {
  const parts: string[] = [];
  if (s.selfCorrections > 0) {
    parts.push(
      "You got more careful after your first mistake rather than more stubborn.",
    );
  }
  if (n.reasoning.length > 0) {
    parts.push(
      `When asked to explain yourself you gave a real answer: "${truncate(
        n.reasoning[n.reasoning.length - 1].answer,
        120,
      )}"`,
    );
  }
  if (n.experiments.length >= 2) {
    parts.push(
      `You worked the dial through ${n.experiments
        .map((e) => e.value)
        .join(" → ")} before you were satisfied.`,
    );
  }
  if (parts.length === 0) {
    parts.push(
      "You worked all the way through without needing to be talked out of a wrong idea.",
    );
  }
  return parts.join(" ");
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
