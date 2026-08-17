/**
 * The story layer is fully deterministic. Nothing in this file may depend on
 * the partner agent — the engine must be playable when the agent is offline.
 */

export type Domain =
  "physics" | "biology" | "economics" | "chemistry" | "history";

/** Visual mood for a scene. Maps to a pre-defined gradient/backdrop. */
export type Mood = "calm" | "tense" | "alarm" | "insight" | "night" | "resolve";

/**
 * Art directions for the stage. Each belongs to a family (bridge / reactor /
 * city) that shares one frame, so a new scenario adds kinds without touching
 * the others' drawings.
 */
export type SceneVisualKind =
  // bridge family
  | "bridge"
  | "scan"
  | "resonance"
  | "weights"
  | "storm"
  | "dawn"
  // reactor family
  | "reactor"
  | "reaction"
  | "cooling"
  | "vent"
  | "plant-dawn"
  // city family
  | "city"
  | "market"
  | "queue"
  | "council"
  | "city-dawn"
  // lab family
  | "lab"
  | "evidence"
  | "sequencer"
  | "interview"
  | "lab-dawn"
  // troy family
  | "walls"
  | "horse"
  | "assembly"
  | "shore"
  | "troy-dawn";

export interface SceneVisual {
  kind: SceneVisualKind;
  title: string;
  caption: string;
  status: string;
}

/**
 * A micro-lesson: the one word this beat cannot be understood without.
 *
 * Stories are allowed to use a technical word — that is half the point — but
 * never before this card has said what it means in ordinary language.
 *
 * Attach it to the scene that *asks something of the learner* — a choice,
 * slider or reorder — not to the narrative page in front of it. A definition
 * on a page whose only control is "Continue" gets read as scenery and is gone
 * by the time it is needed. On a decision page it is the thing that makes the
 * decision answerable, so it gets read.
 *
 * The rules, enforced by `npm run verify`:
 *   - a primer may only live on a `choice`, `slider` or `reorder` scene;
 *   - `plain` is one sentence, and may not lean on another technical word;
 *   - `like` reaches for something the learner already owns — a phone number,
 *     a swing, a queue — because a definition you cannot picture is just more
 *     vocabulary.
 */
export interface ScenePrimer {
  /** The word being unpacked. Shown as the card's heading. */
  term: string;
  /** What it means, in one plain sentence. */
  plain: string;
  /** An everyday comparison that makes it stick. */
  like?: string;
}

export type StorySimulationKind =
  | "timed-pushes"
  | "storm-band"
  | "heat-race"
  | "feed-slow"
  | "runaway-clock"
  | "price-cap"
  | "supply-shift"
  | "budget-split"
  | "marker-match"
  | "contamination-path"
  | "suspect-funnel"
  | "siege-clock"
  | "story-check"
  | "horse-hollow";

export interface ChoiceOption {
  id: string;
  label: string;
  /** Short line describing what the option actually does. */
  detail?: string;
  correct: boolean;
  /**
   * What happens in the world because the learner did this.
   *
   * Required on correct options. Without it the story jumps straight from a
   * decision to the next scene, so the thing you just decided never visibly
   * happens — which is what makes a story read as a series of disconnected
   * cards rather than one continuous run of events.
   */
  outcome?: string;
  /** Scene shown after picking this option. */
  next: string;
  /**
   * Tag describing the reasoning style this option represents. The partner
   * uses these to ground observations in behaviour rather than personality.
   */
  approach?: ApproachTag;
}

export type ApproachTag =
  | "measure_first"
  | "act_first"
  | "brute_force"
  | "isolate_variable"
  | "change_many"
  | "seek_pattern"
  | "follow_authority"
  | "abandon_hypothesis"
  | "commit_to_hypothesis";

interface SceneBase {
  id: string;
  act: 1 | 2 | 3;
  mood: Mood;
  /** Short label rendered in the progress rail. */
  beat: string;
  /** Story-facing direction for the artwork stage. */
  visual: SceneVisual;
  /** Optional hands-on model shown before the decision. */
  simulation?: StorySimulationKind;
  /**
   * Optional micro-lesson(s), shown between the story beat and the decision.
   * A decision that turns on two unfamiliar words may carry both.
   */
  primer?: ScenePrimer | ScenePrimer[];
}

export interface NarrativeScene extends SceneBase {
  type: "narrative";
  /** Rendered one paragraph at a time. */
  text: string[];
  next: string;
}

export interface ChoiceScene extends SceneBase {
  type: "choice";
  text: string[];
  prompt: string;
  options: ChoiceOption[];
  /** Shown when a wrong option is picked, keyed by option id. */
  consequences: Record<string, string>;
  /**
   * Progressive hints, used verbatim when the partner is unavailable and as
   * grounding material when it is.
   */
  hints: [string, string, string];
  /** The concept this decision tests, given to the partner for context. */
  concept: string;
  /** Ask the learner to explain themselves after this decision. */
  probe?: string;
}

export interface SliderScene extends SceneBase {
  type: "slider";
  text: string[];
  prompt: string;
  slider: {
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    initial: number;
  };
  /** Inclusive band that counts as a correct setting. */
  target: { min: number; max: number };
  /** Live readout computed from the slider value. */
  readout: {
    label: string;
    unit: string;
    expr: SliderExpr;
    params: Record<string, number>;
    decimals: number;
  };
  /** The fixed value the readout is being compared against. */
  driver: { label: string; value: number; unit: string };
  /**
   * How the risk meter reads the gap between readout and driver.
   * `separation` — danger when the two values *match* (resonance).
   * `ceiling`    — danger when the readout climbs towards the driver (a limit).
   */
  risk: { mode: "separation" | "ceiling"; safeGap: number };
  /** Which instrument is drawn above the track. */
  meter: "wave" | "thermometer" | "market" | "crowd" | "gauge";
  /** Feedback bands, evaluated in ascending order; first match wins. */
  bands: { max: number; text: string }[];
  hints: [string, string, string];
  concept: string;
  probe?: string;
  next: string;
}

/** Named formulas so scenario content stays serialisable. */
export type SliderExpr =
  | "resonance_ratio"
  | "natural_frequency"
  | "peak_temperature"
  | "market_rent"
  | "profile_pool"
  | "night_march";

export interface ReorderStep {
  id: string;
  label: string;
  /** Optional second line, e.g. the mechanism behind the step. */
  detail?: string;
}

/**
 * Put the steps in order. Authored in the *correct* order; the renderer
 * shuffles deterministically so server and client agree.
 */
export interface ReorderScene extends SceneBase {
  type: "reorder";
  text: string[];
  prompt: string;
  /** One line above the list telling the learner what "in order" means here. */
  instruction: string;
  steps: ReorderStep[];
  /** Shown when the submitted order is wrong. */
  wrong: string;
  /** Shown when the submitted order is right. */
  right: string;
  hints: [string, string, string];
  concept: string;
  probe?: string;
  next: string;
}

export interface ReflectScene extends SceneBase {
  type: "reflect";
  text: string[];
  prompt: string;
  placeholder: string;
  next: string;
}

export interface EndingScene extends SceneBase {
  type: "ending";
  text: string[];
  outcome: "success" | "partial";
}

export type Scene =
  | NarrativeScene
  | ChoiceScene
  | SliderScene
  | ReorderScene
  | ReflectScene
  | EndingScene;

export interface PreSessionQuestion {
  prompt: string;
  options: { id: string; label: string; approach: ApproachTag }[];
}

/**
 * The thing the learner keeps after the credits roll.
 *
 * The Thinking Profile describes *how they thought*. This is the other half:
 * the piece of physics, chemistry, biology, economics or method they now own,
 * named so they can recognise it again and use it somewhere the story never
 * went. A story that cannot fill this in honestly is entertainment, not a
 * lesson.
 */
export interface StoryTakeaway {
  /** The proper name of the idea, e.g. "Resonance". Learners need the word. */
  concept: string;
  /** The domain label shown beside it, e.g. "Physics". */
  field: string;
  /** The whole idea in one plain sentence. */
  inOneLine: string;
  /** Why it is worth carrying around — the transferable rule. */
  rule: string;
  /** Two or three other places the same idea shows up. */
  elsewhere: string[];
  /** The moments in this story where they actually used it. */
  youUsedIt: string[];
}

export interface Scenario {
  id: string;
  title: string;
  tagline: string;
  domain: Domain;
  difficulty: "easy" | "medium" | "hard";
  learningGoal: string;
  /** What the learner walks away knowing. Shown before the profile. */
  takeaway: StoryTakeaway;
  /** Roughly how long a full playthrough takes. */
  minutes: number;
  /** Ticker label on the stage, e.g. "Aetherfall live". */
  stageLabel: string;
  /** Fallback line the partner opens with. Keep it scenario-flavoured. */
  partnerGreeting: string;
  intro: {
    role: string;
    text: string[];
    /** Label on the button that starts the story. */
    cta: string;
    visual: SceneVisual;
  };
  /** Fallback pre-session question, used when the partner can't generate one. */
  preSession: PreSessionQuestion;
  startScene: string;
  scenes: Scene[];
}

/* ------------------------------------------------------------------ */
/* Session notes — the learner model. Session-scoped, deliberately small. */
/* ------------------------------------------------------------------ */

export type ObservationCategory =
  | "strategy"
  | "mistake"
  | "reasoning"
  | "adaptation"
  | "help_seeking"
  | "decision_pattern";

export interface ThinkingObservation {
  category: ObservationCategory;
  observation: string;
  evidence: string;
  confidence: number;
  sceneId: string;
}

export interface SessionNotes {
  scenarioId: string;
  startedAt: number;
  preSessionAnswer?: {
    question: string;
    answer: string;
    approach?: ApproachTag;
  };
  observations: ThinkingObservation[];
  mistakes: { sceneId: string; mistake: string; corrected: boolean }[];
  decisions: {
    sceneId: string;
    choice: string;
    correct: boolean;
    /** The in-world result shown after this choice or ordered sequence. */
    outcome?: string;
    attempt: number;
    approach?: ApproachTag;
    at: number;
  }[];
  reasoningSamples: { sceneId: string; question: string; answer: string }[];
  /** Every slider value the learner committed to, in order. */
  experiments: {
    sceneId: string;
    value: number;
    correct: boolean;
    /** The authored feedback shown for this committed value. */
    outcome?: string;
  }[];
  hintsUsed: number;
  selfCorrections: number;
  helpRequests: number;
}

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
