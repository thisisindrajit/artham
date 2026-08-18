/**
 * Headless walkthrough of the deterministic story engine.
 *
 * Runs with no browser, no network and no agent: if this passes, the story is
 * playable with the partner completely offline, which is the reliability
 * guarantee the product depends on.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { resonanceBridge } from "../stories/resonance-bridge/scenario";
import { getScene, scenarios as allScenarios } from "../lib/story/index";
import { shuffledStepIds } from "../utils/story-shuffle";
import type { Scenario, Scene, ScenePrimer } from "../types/story";
import {
  currentScene,
  initState,
  shouldConsultPartner,
  step,
  type Action,
  type EngineEvent,
  type PlayState,
} from "../lib/engine/index";
import { isSliderCorrect, readoutFor } from "../utils/engine-formulas";
import { fallbackObserve, fallbackProfile } from "../lib/partner/fallbacks";
import { digestNotes } from "../utils/session-notes";

/** The bridge stays the reference story for the physics-specific checks. */
const scenario = resonanceBridge;

/**
 * A scripted move. Strings pick an option, numbers commit a slider, and the
 * two sentinels drive a reorder: `@ok` submits the authored order, `@bad`
 * swaps the first two steps so it is guaranteed wrong.
 */
type Move = string | number;
const OK = "@ok";
const BAD = "@bad";
let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL ${name}\n       ${(error as Error).message}`);
  }
}

/* ------------------------------------------------------------------ */
console.log("\nstory integrity");

check("five scenarios are registered and uniquely identified", () => {
  assert.equal(allScenarios.length, 5, "the landing page expects 5 scenarios");
  const ids = allScenarios.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate scenario id");
  const domains = new Set(allScenarios.map((s) => s.domain));
  assert.ok(domains.has("physics") && domains.has("chemistry"));
  assert.ok(domains.has("economics"), "no economics scenario registered");
  assert.ok(domains.has("biology"), "no biology scenario registered");
  assert.ok(domains.has("history"), "no history scenario registered");
  for (const s of allScenarios) {
    assert.ok(s.stageLabel.trim().length > 3, `${s.id} has no stage label`);
    assert.ok(s.intro.cta.trim().length > 3, `${s.id} has no intro button`);
    assert.ok(
      s.partnerGreeting.trim().length > 20,
      `${s.id} has no partner greeting`,
    );
  }
});

check("every scene reference resolves", () => {
  for (const story of allScenarios) {
    const ids = new Set(story.scenes.map((s) => s.id));
    const refs: [string, string][] = [["<start>", story.startScene]];
    for (const scene of story.scenes) {
      for (const next of exits(scene)) refs.push([scene.id, next]);
    }
    for (const [from, to] of refs) {
      assert.ok(ids.has(to), `${story.id}/${from} points at missing "${to}"`);
    }
  }
});

check("every wrong option has a consequence", () => {
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      if (scene.type !== "choice") continue;
      for (const option of scene.options) {
        if (option.correct) continue;
        assert.ok(
          scene.consequences[option.id],
          `${story.id}/${scene.id}/${option.id} has no consequence text`,
        );
      }
    }
  }
});

check("every decision scene has at least one correct option", () => {
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      if (scene.type !== "choice") continue;
      assert.ok(
        scene.options.some((o) => o.correct),
        `${story.id}/${scene.id} is unwinnable`,
      );
    }
  }
});

check("every choice, slider and reorder scene has three hints", () => {
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      if (
        scene.type !== "choice" &&
        scene.type !== "slider" &&
        scene.type !== "reorder"
      ) {
        continue;
      }
      assert.equal(
        scene.hints.length,
        3,
        `${story.id}/${scene.id} hint ladder is wrong`,
      );
      for (const hint of scene.hints) assert.ok(hint.trim().length > 10);
    }
  }
});

check("every beat has story-stage direction", () => {
  for (const story of allScenarios) {
    const visuals = [story.intro.visual, ...story.scenes.map((s) => s.visual)];
    for (const visual of visuals) {
      assert.ok(visual.kind, `${story.id}: visual kind is missing`);
      assert.ok(visual.title.trim().length > 3, `${story.id}: no visual title`);
      assert.ok(
        visual.caption.trim().length > 10,
        `${story.id}: visual caption is too short`,
      );
      assert.ok(
        visual.status.trim().length > 3,
        `${story.id}: no visual status`,
      );
    }
  }
});

/**
 * Micro-lessons. A story is allowed to use a technical word, but never before
 * a primer has said what it means — and the primer itself has to be readable,
 * or it is just a second wall of jargon.
 */
const JARGON_IN_PRIMERS =
  /\b(allele|locus|loci|amplitude|damping|exotherm|stoichiometr\w*|equilibri\w*|elasticit\w*|marginal utility|arbitrage|amortis\w*|amortiz\w*|liquidity|reagent|substrate|catalys\w*|attenuat\w*|phalanx|stratagem)\b/i;

/** A scene may carry one primer or several; normalise both shapes. */
const primersOf = (scene: Scene): ScenePrimer[] => {
  const p = (scene as Scene & { primer?: ScenePrimer | ScenePrimer[] }).primer;
  if (!p) return [];
  return Array.isArray(p) ? p : [p];
};

/** Scene types that ask the learner for something. */
const DECIDES = new Set(["choice", "slider", "reorder"]);

check("every scenario teaches its hard words before it uses them", () => {
  for (const story of allScenarios) {
    const primers = story.scenes.flatMap(primersOf);
    assert.ok(
      primers.length >= 3,
      `${story.id}: only ${primers.length} micro-lesson(s) — a learner meeting new words needs at least 3`,
    );

    const terms = primers.map((p) => p.term.toLowerCase());
    assert.equal(
      new Set(terms).size,
      terms.length,
      `${story.id}: the same term is explained twice`,
    );

    for (const primer of primers) {
      assert.ok(
        primer.term.trim().length > 2,
        `${story.id}: a primer has no term`,
      );
      // One idea, one card. Anything longer stops being a glance.
      const words = primer.plain.trim().split(/\s+/).length;
      assert.ok(
        words >= 8 && words <= 42,
        `${story.id}: primer "${primer.term}" is ${words} words — aim for 8–42`,
      );
      const jargon = JARGON_IN_PRIMERS.exec(
        `${primer.plain} ${primer.like ?? ""}`,
      );
      assert.equal(
        jargon,
        null,
        `${story.id}: primer "${primer.term}" explains a hard word with another one ("${jargon?.[0]}")`,
      );
      assert.ok(
        primer.like && primer.like.trim().length > 12,
        `${story.id}: primer "${primer.term}" has no everyday comparison`,
      );
    }
  }
});

/**
 * A definition on a page whose only control is "Continue" reads as scenery and
 * is gone by the time it is needed. Micro-lessons belong on the page that asks
 * the learner for something.
 */
check("micro-lessons sit on the page that asks the question", () => {
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      const primers = primersOf(scene);
      if (!primers.length) continue;
      assert.ok(
        DECIDES.has(scene.type),
        `${story.id}/${scene.id}: primer "${primers[0].term}" sits on a "${scene.type}" scene — move it to the choice, slider or reorder it explains`,
      );
      assert.ok(
        primers.length <= 2,
        `${story.id}/${scene.id}: ${primers.length} micro-lessons on one decision — that is a lecture, not a primer`,
      );
    }
  }
});

/**
 * Stronger than "somewhere in the story": the word has to be on the very page
 * the card is on, or the card is answering a question nobody asked.
 */
check("no micro-lesson defines a word its own scene never says", () => {
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      const primers = primersOf(scene);
      if (!primers.length) continue;

      const s = scene as Scene & {
        text?: string[];
        prompt?: string;
        instruction?: string;
        options?: { label: string }[];
        steps?: { label: string }[];
      };
      const onPage = [
        ...(s.text ?? []),
        s.prompt ?? "",
        s.instruction ?? "",
        ...(s.options ?? []).map((o) => o.label),
        ...(s.steps ?? []).map((o) => o.label),
      ]
        .join(" ")
        .toLowerCase();

      for (const primer of primers) {
        // Match on the headword so "Quenching" still finds "quench".
        const head = primer.term
          .toLowerCase()
          .replace(/^(the|a|an)\s+/, "")
          .split(/\s+/)[0]
          .replace(/(ing|s)$/, "");
        assert.ok(
          onPage.includes(head),
          `${story.id}/${scene.id}: primer "${primer.term}" defines a word this scene never says`,
        );
      }
    }
  }
});

/**
 * The single most common way a story stops feeling like a story: the learner
 * makes the right call and the next page acts as though it never happened. A
 * wrong answer already gets a "Meanwhile…" beat; without `outcome` the correct
 * answer is the only move in the game with no visible consequence, which reads
 * as a cut. So every correct option must show the world changing.
 */
check("every correct choice shows what it changed", () => {
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      if (scene.type !== "choice") continue;
      for (const option of scene.options) {
        if (!option.correct) continue;
        const outcome = option.outcome?.trim() ?? "";
        assert.ok(
          outcome.length > 0,
          `${story.id}/${scene.id}: correct option "${option.id}" has no outcome beat, so picking it cuts straight to the next scene`,
        );
        assert.ok(
          outcome.length >= 60,
          `${story.id}/${scene.id}: outcome for "${option.id}" is too short to land as a story beat`,
        );
      }
    }
  }
});

/** A story the learner cannot name the lesson of has taught them a mood. */
check("every scenario names what it taught", () => {
  for (const story of allScenarios) {
    const t = story.takeaway;
    assert.ok(t, `${story.id}: no takeaway`);
    for (const [key, min] of [
      ["concept", 4],
      ["field", 4],
      ["inOneLine", 80],
      ["rule", 80],
    ] as const) {
      assert.ok(
        t[key].trim().length >= min,
        `${story.id}: takeaway.${key} is missing or too thin`,
      );
    }
    assert.ok(
      t.elsewhere.length >= 3,
      `${story.id}: a concept with fewer than three other homes is not portable`,
    );
    assert.ok(
      t.youUsedIt.length >= 3,
      `${story.id}: takeaway must point at three moments in this run`,
    );
    for (const line of [...t.elsewhere, ...t.youUsedIt]) {
      assert.ok(line.trim().length >= 25, `${story.id}: takeaway line too thin: "${line}"`);
    }
  }
});

/* ------------------------------------------------------------------ */
/**
 * Readability. A story nobody can follow is not a hard story, it is a broken
 * one — and the failure is silent, because a confused learner blames himself
 * and quits. These three gates make "a child could follow this" a thing the
 * build can check instead of a thing we hope for.
 */

/** Every learner-facing string in a scenario, tagged with where it lives. */
function proseOf(story: Scenario): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const add = (where: string, ...text: (string | undefined)[]) => {
    for (const t of text) if (t && t.trim()) out.push({ where, text: t });
  };

  add("tagline", story.tagline, story.learningGoal, story.partnerGreeting);
  add("blurb", story.blurb);
  add("intro", story.intro.role, ...story.intro.text, story.intro.cta);
  add("preSession", story.preSession.prompt, ...story.preSession.options.map((o) => o.label));
  const t = story.takeaway;
  add("takeaway", t.inOneLine, t.rule, ...t.elsewhere, ...t.youUsedIt);

  for (const visual of [story.intro.visual, ...story.scenes.map((s) => s.visual)]) {
    add("visual", visual.title, visual.caption, visual.status);
  }

  for (const scene of story.scenes) {
    const at = `${scene.id}`;
    add(at, scene.beat);
    for (const primer of primersOf(scene)) add(`${at}/primer`, primer.plain, primer.like);
    if (scene.type !== "ending") add(at, ...(scene.text ?? []));
    else add(at, ...scene.text);
    if (scene.type === "choice") {
      add(at, scene.prompt, scene.probe, ...scene.hints);
      for (const o of scene.options) add(`${at}/${o.id}`, o.label, o.detail, o.outcome);
      add(`${at}/consequence`, ...Object.values(scene.consequences));
    }
    if (scene.type === "slider") {
      add(at, scene.prompt, scene.probe, ...scene.hints, scene.slider.label, scene.readout.label, scene.driver.label);
      add(`${at}/band`, ...scene.bands.map((b) => b.text));
    }
    if (scene.type === "reorder") {
      add(at, scene.prompt, scene.probe, scene.instruction, scene.wrong, scene.right, ...scene.hints);
      for (const s of scene.steps) add(`${at}/${s.id}`, s.label, s.detail);
    }
    if (scene.type === "reflect") add(at, scene.prompt, scene.placeholder);
    if (scene.trivia) add(`${at}/trivia`, scene.trivia.title, scene.trivia.text);
    if (scene.simGuide) {
      add(`${at}/simGuide`, scene.simGuide.shows, scene.simGuide.move, scene.simGuide.watch);
    }
  }
  return out;
}

const wordCount = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

/** Split on sentence enders, but not on the dot inside "12.5" or "Mr.". */
const sentencesOf = (text: string) =>
  text
    .split(/(?<=[.!?…])(?=\s)|(?<=[.!?…])$/)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * 24 words is roughly two breaths. Past that a sentence starts stacking clauses,
 * and the learner has to hold the first half in their head while parsing the
 * second — which is exactly the attention they should be spending on the story.
 */
const MAX_SENTENCE_WORDS = 24;

/** Report every offender at once: fixing prose one failure per run is misery. */
const allOf = (problems: string[], label: string) =>
  assert.ok(
    problems.length === 0,
    `${problems.length} ${label}:\n       - ${problems.join("\n       - ")}`,
  );

check("no sentence runs longer than a learner can hold", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    for (const { where, text } of proseOf(story)) {
      for (const sentence of sentencesOf(text)) {
        const n = wordCount(sentence);
        if (n > MAX_SENTENCE_WORDS) {
          problems.push(`${story.id}/${where}: ${n} words — "${sentence.slice(0, 80)}…"`);
        }
      }
    }
  }
  allOf(problems, "sentence(s) too long to follow — split them");
});

/**
 * Words a ten-year-old would stumble over. None are banned outright: a story
 * may use any of them the moment a micro-lesson has said what it means. What is
 * banned is dropping one in and walking on.
 */
const HARD_WORDS = [
  "allele", "amortise", "arithmetic", "assembly", "attenuate", "bund",
  "catalyst", "chronicle", "coolant", "councillor", "counterweight", "decree",
  "dilution", "elasticity", "equilibrium", "excavation", "exotherm",
  "exothermic", "herald", "hypothesis", "inhibitor", "irreversible", "keel",
  "legislate", "liquidity", "locus", "maintenance", "motive", "oath",
  "parapet", "persuasion", "phalanx", "plinth", "postholes", "protocol",
  "quench", "rampart", "ration", "reagent", "rehearsal", "rezoning", "sacred",
  "sally", "scepticism", "sceptic", "scrubber", "solvent", "stirrer",
  "stoichiometry", "stratagem", "subsidised", "subsidized", "substrate",
  "tenancy", "testimony", "thermal", "vacancy", "voucher",
];

check("no hard word is used before something explains it", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    const taught = story.scenes
      .flatMap(primersOf)
      .map((p) => p.term.toLowerCase())
      .join(" ");
    for (const { where, text } of proseOf(story)) {
      if (where.endsWith("/primer")) continue;
      for (const word of HARD_WORDS) {
        if (taught.includes(word)) continue;
        const hit = new RegExp(`\\b${word}(s|es|ed|ing|d)?\\b`, "i").exec(text);
        if (hit) problems.push(`${story.id}/${where}: "${hit[0]}"`);
      }
    }
  }
  allOf(problems, "unexplained hard word(s) — use a plainer word or add a micro-lesson");
});

/**
 * Names are the cheapest way to lose a reader. Every new capitalised word is
 * one more thing to remember on top of the idea the story exists to teach, and
 * a learner who has lost track of who is speaking has stopped learning.
 */
const NOT_A_NAME = new Set(
  ("a an the this that these those i you he she it we they there here and but or so if"
    + " because before after once only just still even also when where why how what which while"
    + " with without under over out up down in on at by for from to of as than then now"
    + " no not nobody somebody everybody something everything anything nothing whatever whoever"
    + " your their his her its my our all any both each either neither every same other another"
    + " some most more less least first second third last next one two three four five six seven"
    + " eight nine ten eleven twelve twenty thirty forty fifty hundred thousand half"
    + " do does did don doesn let make made get got give gave keep kept stop start started say"
    + " said tell told show shows find found test check checked measure move moved open close"
    + " wait hold pick picked put ask asked look looking take taken run runs write wrote read"
    + " good bad right wrong yes enough sorry ok okay maybe perhaps"
    + " monday tuesday wednesday thursday friday saturday sunday tonight today tomorrow yesterday"
    + " january february march april may june july august september october november december"
  ).split(" "),
);

/** Distinct capitalised words that are not sentence-initial and not ordinary. */
function namesIn(story: Scenario): Set<string> {
  /** Keyed by singular root so "Greek" and "Greeks" count once. */
  const names = new Map<string, string>();
  for (const { where, text } of proseOf(story)) {
    if (where === "visual" || where === "tagline") continue; // labels, not prose
    // A real place or person named inside a "did you know" is a fact, not a
    // character — the learner is never asked to keep track of it.
    if (where.endsWith("/trivia")) continue;
    for (const sentence of sentencesOf(text)) {
      const tokens = sentence.split(/\s+/);
      tokens.forEach((raw, i) => {
        // Strip punctuation and any contraction tail, so "I'm" reads as "I".
        const word = raw.replace(/[^\p{L}’'-]/gu, "").replace(/[’'].*$/u, "");
        if (word.length < 3 || !/^\p{Lu}/u.test(word)) return;
        if (word === word.toUpperCase()) return; // acronyms and shouted headlines
        if (i === 0) return; // sentence-initial capitals prove nothing
        if (/^[“"‘']/.test(raw)) return; // first word of a quotation, likewise
        if (NOT_A_NAME.has(word.toLowerCase())) return;
        if (/[.!?…:—-]$/.test(tokens[i - 1] ?? "")) return; // still sentence-initial
        names.set(word.replace(/s$/, ""), word);
      });
    }
  }
  return new Set(names.values());
}

/** Three people and a place is a cast. Eight is a register of attendance. */
const MAX_NAMES = 6;

check("every scenario keeps a cast a learner can hold", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    const names = [...namesIn(story)].sort();
    if (names.length > MAX_NAMES) {
      problems.push(`${story.id}: ${names.length} names — ${names.join(", ")}`);
    }
  }
  allOf(problems, `scenario(s) with more than ${MAX_NAMES} names to remember`);
});

/* ------------------------------------------------------------------ */
/**
 * Delight, checked.
 *
 * An hour of decisions with no air in it is an exam. Trivia cards and the
 * emoji in the prose are the air — but "make it fun" is exactly the kind of
 * instruction that quietly rots, so both are gates rather than good
 * intentions. The rules below are the ones that keep them from turning back
 * into work: a fact is short, it is one fact, and it is spread through the
 * story rather than dumped in the first chapter.
 */

const EMOJI = /\p{Extended_Pictographic}/u;
const MIN_TRIVIA = 3;
/** Past two sentences a "did you know" is a paragraph, and gets skipped. */
const MAX_TRIVIA_WORDS = 42;

/**
 * Words too common to prove a trivia card is on topic. A fact that shares only
 * "there" or "people" with its scene shares nothing.
 */
const TOPIC_STOPWORDS = new Set([
  "about", "after", "again", "against", "another", "anyone", "around", "because",
  "before", "being", "below", "between", "could", "every", "first", "found",
  "front", "given", "gives", "going", "great", "hands", "into", "least",
  "leave", "looks", "makes", "means", "might", "never", "night", "nobody",
  "number", "numbers", "often", "other", "others", "people", "place", "point",
  "right", "round", "small", "something", "still", "story", "taken", "takes",
  "their", "there", "these", "thing", "things", "think", "those", "three",
  "times", "under", "until", "using", "wants", "watch", "where", "which",
  "while", "whole", "would", "years", "young",
]);

/** Distinctive words a scene is actually about. */
const topicWords = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 5 && !TOPIC_STOPWORDS.has(w))
      // "markers" and "marker" are the same subject.
      .map((w) => (w.endsWith("s") && w.length > 5 ? w.slice(0, -1) : w)),
  );

check("every scenario hands out facts worth repeating", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    const cards = story.scenes.flatMap((scene) =>
      scene.trivia ? [{ scene, trivia: scene.trivia }] : [],
    );

    if (cards.length < MIN_TRIVIA) {
      problems.push(`${story.id}: only ${cards.length} trivia card(s), wants ${MIN_TRIVIA}`);
    }
    // All in act 1 means the story stops being fun exactly when it gets hard.
    const acts = new Set(cards.map((c) => c.scene.act));
    if (cards.length > 0 && acts.size < 2) {
      problems.push(`${story.id}: every trivia card sits in act ${[...acts][0]}`);
    }
    const titles = new Set<string>();
    for (const { scene, trivia } of cards) {
      const at = `${story.id}/${scene.id}`;
      if (!EMOJI.test(trivia.emoji)) {
        problems.push(`${at}: trivia emoji "${trivia.emoji}" is not an emoji`);
      }
      const titleWords = wordCount(trivia.title);
      if (titleWords < 2 || titleWords > 5) {
        problems.push(`${at}: trivia title is ${titleWords} word(s) — "${trivia.title}"`);
      }
      if (titles.has(trivia.title.toLowerCase())) {
        problems.push(`${at}: repeats the trivia title "${trivia.title}"`);
      }
      titles.add(trivia.title.toLowerCase());

      const sentences = sentencesOf(trivia.text);
      if (sentences.length > 2) {
        problems.push(`${at}: trivia runs ${sentences.length} sentences — keep it to two`);
      }
      const words = wordCount(trivia.text);
      if (words > MAX_TRIVIA_WORDS) {
        problems.push(`${at}: trivia is ${words} words — "${trivia.text.slice(0, 60)}…"`);
      }

      /**
       * Placement. A true fact in the wrong beat is an interruption: the
       * learner is mid-thought about ship ruts and gets handed a note about
       * calendars. So a card has to be about something its own scene is
       * talking about, right there on the page.
       */
      const here = topicWords(
        [scene.beat, ...(scene.text ?? []), scene.visual.title, scene.visual.caption].join(" "),
      );
      const fact = topicWords(`${trivia.title} ${trivia.text}`);
      const shared = [...fact].filter((w) => here.has(w));
      if (shared.length === 0) {
        problems.push(
          `${at}: trivia "${trivia.title}" shares no subject with its own scene — move it to the beat it belongs to`,
        );
      }
    }
  }
  allOf(problems, "trivia problem(s)");
});

/**
 * The subject lesson has to happen in the story, not on the card at the end.
 * A learner who plays a chemistry story should come out knowing something about
 * chemistry — so the idea named in `takeaway.concept` must be worked through in
 * the prose itself, in more than one beat, before the ending claims it.
 */
check("every scenario teaches its concept inside the story", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    const idea = topicWords(`${story.takeaway.concept} ${story.takeaway.inOneLine}`);
    if (idea.size === 0) {
      problems.push(`${story.id}: takeaway.concept has no word specific enough to teach`);
      continue;
    }
    const beats = story.scenes.filter((scene) => {
      if (scene.type === "ending") return false;
      const here = topicWords(
        [...(scene.text ?? []), ...primersOf(scene).map((p) => `${p.term} ${p.plain}`)].join(" "),
      );
      return [...idea].some((w) => here.has(w));
    });
    if (beats.length < 2) {
      problems.push(
        `${story.id}: "${story.takeaway.concept}" is worked through in ${beats.length} beat(s) — the ending claims a lesson the story never taught`,
      );
    }
  }
  allOf(problems, "concept problem(s)");
});

/**
 * Emoji belong in the prose, not only in the recap rail — but one per
 * paragraph, at most. Two is a text message; three is a ransom note.
 */
const MIN_EMOJI_LINES = 4;
check("every scenario carries emoji in the story itself", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    let lines = 0;
    for (const scene of story.scenes) {
      for (const line of scene.text) {
        const found = [...line].filter((ch) => EMOJI.test(ch));
        if (found.length === 0) continue;
        lines += 1;
        if (found.length > 1) {
          problems.push(
            `${story.id}/${scene.id}: ${found.length} emoji in one paragraph — "${line.slice(0, 60)}…"`,
          );
        }
      }
    }
    if (lines < MIN_EMOJI_LINES) {
      problems.push(
        `${story.id}: only ${lines} story paragraph(s) carry an emoji, wants ${MIN_EMOJI_LINES}`,
      );
    }
  }
  allOf(problems, "emoji problem(s) in story prose");
});

/* ------------------------------------------------------------------ */
/**
 * Length. The stories drifted to twelve and thirteen minutes, and the report
 * from the person playing them was blunt: "there's a lot of things going on, so
 * it's very hard to keep track."
 *
 * `minutes` is printed on the picker and in the session header, so it is a
 * promise, and until now it was a hand-typed guess. This estimates it from what
 * a learner actually reads and does, then insists the printed number matches.
 * Nobody can quietly relabel a long story as a short one.
 */

/**
 * Both constants are fitted, not guessed. The five stories carried hand-typed
 * minute labels from the people who wrote them; 220 words a minute with ten
 * seconds of thinking per decision reproduces every one of those labels to
 * within a minute, which is as close as a reading estimate gets to honest.
 */
const WORDS_PER_MINUTE = 220;
/** Reading a decision is already in the word count; this is think-and-click. */
const MINUTES_PER_INTERACTION = 0.17;
const MAX_STORY_MINUTES = 7;
const MAX_SCENES = 11;

/** Everything a learner reads on one clean pass, hints and retries aside. */
function readingWords(story: Scenario): number {
  let words = 0;
  const add = (...text: (string | undefined)[]) => {
    for (const t of text) if (t) words += wordCount(t);
  };

  add(story.intro.role, ...story.intro.text, story.intro.cta);
  add(story.preSession.prompt, ...story.preSession.options.map((o) => o.label));
  add(story.takeaway.inOneLine, story.takeaway.rule);
  add(...story.takeaway.elsewhere, ...story.takeaway.youUsedIt);

  for (const scene of story.scenes) {
    add(...(scene.text ?? []));
    for (const primer of primersOf(scene)) add(primer.term, primer.plain, primer.like);
    if (scene.trivia) add(scene.trivia.title, scene.trivia.text);
    if (scene.simGuide) add(scene.simGuide.shows, scene.simGuide.move, scene.simGuide.watch);
    if (scene.type === "choice") {
      add(scene.prompt);
      for (const o of scene.options) add(o.label, o.detail);
      // One outcome is read per run, not all of them.
      const right = scene.options.find((o) => o.correct);
      add(right?.outcome);
    }
    if (scene.type === "slider") {
      add(scene.prompt, scene.slider.label, scene.readout.label, scene.driver.label);
      add(...scene.bands.map((b) => b.text));
    }
    if (scene.type === "reorder") {
      add(scene.prompt, scene.instruction, scene.right);
      for (const s of scene.steps) add(s.label, s.detail);
    }
    if (scene.type === "reflect") add(scene.prompt, scene.placeholder);
  }
  return words;
}

const INTERACTIVE = new Set<Scene["type"]>(["choice", "slider", "reorder", "reflect"]);

function estimateMinutes(story: Scenario): number {
  const interactions = story.scenes.filter((s) => INTERACTIVE.has(s.type)).length;
  const raw =
    readingWords(story) / WORDS_PER_MINUTE + interactions * MINUTES_PER_INTERACTION;
  return Math.round(raw);
}

check("no story outstays the time it promises", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    const estimate = estimateMinutes(story);
    const words = readingWords(story);

    if (estimate > MAX_STORY_MINUTES) {
      problems.push(
        `${story.id}: runs about ${estimate} min (${words} words) — cut to ${MAX_STORY_MINUTES}`,
      );
    }
    if (story.minutes !== estimate) {
      problems.push(
        `${story.id}: claims ${story.minutes} min but reads as ${estimate} (${words} words, ${story.scenes.length} scenes)`,
      );
    }
    if (story.scenes.length > MAX_SCENES) {
      problems.push(
        `${story.id}: ${story.scenes.length} scenes — past ${MAX_SCENES} a learner loses the thread`,
      );
    }
  }
  allOf(problems, "length problem(s)");
});

/* ------------------------------------------------------------------ */
/**
 * `difficulty` is rendered as pips on the picker, so it is a promise. It stayed
 * a lie for a while — five stories, all "medium". These are the two levers that
 * are genuinely felt and are not welded to a story's own science: how many
 * plausible options a decision offers, and how much of the story is scaffolded
 * by micro-lessons. Slider tolerance is deliberately *not* used: moving a band
 * would mean lying about the physics.
 */
check("difficulty is a real spread, not a label", () => {
  const labels = new Set(allScenarios.map((s) => s.difficulty));
  assert.ok(labels.has("easy"), "no easy story: the picker has nowhere to start");
  assert.ok(labels.has("hard"), "no hard story: the pips never fill up");

  for (const story of allScenarios) {
    const decisions = story.scenes.filter((s) => DECIDES.has(s.type));
    const primed = decisions.filter((s) => primersOf(s).length > 0).length;
    const coverage = primed / decisions.length;
    const widest = Math.max(
      ...story.scenes.map((s) => (s.type === "choice" ? s.options.length : 0)),
    );

    if (story.difficulty === "easy") {
      assert.ok(
        coverage >= 0.7,
        `${story.id} is "easy" but only ${primed}/${decisions.length} decisions carry a micro-lesson`,
      );
      assert.ok(
        widest <= 4,
        `${story.id} is "easy" but offers a ${widest}-option decision`,
      );
    }
    if (story.difficulty === "hard") {
      assert.ok(
        coverage <= 0.65,
        `${story.id} is "hard" but ${primed}/${decisions.length} decisions are scaffolded`,
      );
      assert.ok(
        widest >= 5,
        `${story.id} is "hard" but no decision offers more than ${widest} options`,
      );
    }
  }
});

check("every scenario ships at least three hands-on simulations", () => {
  const recognised = new Set([
    "timed-pushes",
    "storm-band",
    "heat-race",
    "feed-slow",
    "runaway-clock",
    "price-cap",
    "supply-shift",
    "budget-split",
    "marker-match",
    "contamination-path",
    "suspect-funnel",
    "siege-clock",
    "story-check",
    "horse-hollow",
  ]);
  const used = new Set<string>();
  for (const story of allScenarios) {
    const simulations = story.scenes.flatMap((scene) =>
      scene.simulation ? [scene.simulation] : [],
    );
    // The bridge's two labs plus its slider scene; the newer stories carry
    // three explicit models each.
    const floor = story.id === "resonance-bridge" ? 2 : 3;
    assert.ok(
      simulations.length >= floor,
      `${story.id} only has ${simulations.length} simulations`,
    );
    assert.equal(
      new Set(simulations).size,
      simulations.length,
      `${story.id} reuses a simulation`,
    );
    for (const simulation of simulations) {
      assert.ok(
        recognised.has(simulation),
        `unknown simulation "${simulation}"`,
      );
      used.add(simulation);
    }
  }
  assert.equal(used.size, recognised.size, "a simulation kind is never shown");
});

/**
 * A model with no label is decoration. The complaint that produced this gate
 * was exact: "it's very brief to the point that I don't understand what the
 * simulation does at all… it takes a minute or two for me to understand."
 *
 * So every model must answer three questions in the learner's own order, and
 * must answer them in whole sentences — a four-word answer is the same silence
 * that caused the problem.
 */
const MIN_GUIDE_WORDS = 9;
/** Naming the control is the difference between "tune it" and "drag the bar". */
const CONTROL_WORDS =
  /\b(slider|bar|handle|drag|dragging|slide|button|buttons|tap|press|switch|toggle|arrows?|card|cards|steps?|order|list)\b/i;

check("every simulation says what it shows and what to move", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      const at = `${story.id}/${scene.id}`;
      if (!scene.simulation) {
        if (scene.simGuide) {
          problems.push(`${at}: carries a simGuide but shows no simulation`);
        }
        continue;
      }
      const guide = scene.simGuide;
      if (!guide) {
        problems.push(`${at}: shows "${scene.simulation}" with nothing telling the learner how to read it`);
        continue;
      }
      const fields: [keyof typeof guide, string][] = [
        ["shows", "what the model shows"],
        ["move", "what to move"],
        ["watch", "what changes"],
      ];
      for (const [key, what] of fields) {
        const value = guide[key];
        const words = wordCount(value);
        if (words < MIN_GUIDE_WORDS) {
          problems.push(`${at}: simGuide.${key} is ${words} words — too brief to explain ${what}`);
        }
        if (sentencesOf(value).length > 2) {
          problems.push(`${at}: simGuide.${key} runs past two sentences`);
        }
      }
      if (!CONTROL_WORDS.test(guide.move)) {
        problems.push(`${at}: simGuide.move never names the thing to touch`);
      }
    }
  }
  allOf(problems, "simulation guide problem(s)");
});

/**
 * A guide that quotes a control the component never renders is worse than no
 * guide at all: the learner hunts for a button that does not exist and decides
 * the fault is theirs. Inside a simGuide, curly quotes are only ever used to
 * name something on screen, so every quoted phrase must survive as a literal in
 * the simulation source. Adapt the guide to the component, never the reverse.
 */
const SIM_SOURCE = (() => {
  const root = process.cwd();
  const files = [
    join(root, "components", "sim-kit.tsx"),
    join(root, "components", "story-simulation.tsx"),
  ];
  const storiesDir = join(root, "stories");

  for (const folder of readdirSync(storiesDir, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const storyDir = join(storiesDir, folder.name);
    for (const file of readdirSync(storyDir)) {
      if (/^(simulations|deck-wave)\.tsx$/.test(file)) {
        files.push(join(storyDir, file));
      }
    }
  }

  let text = "";
  for (const file of files) {
    text += readFileSync(file, "utf8");
  }
  return text;
})();

/** Curly quotes only — straight quotes belong to the TypeScript itself. */
const QUOTED = /[\u201c]([^\u201d]{2,60})[\u201d]/g;

/**
 * The same mistake also arrives unquoted: "watch the vacancy line" reads like
 * plain English, but "vacancy" is still a promise about pixels. Any noun used
 * as the name of a readout has to exist in the component too.
 */
const NAMED_READOUT =
  /\bthe ([a-z][a-z-]{2,})(?:\s+([a-z][a-z-]{2,}))? (line|bar|slider|button|counter|readout|gauge|dial|toggle|meter)\b/gi;
/** Words that describe a readout's role rather than name one. */
const GENERIC_READOUT = new Set([
  "same", "other", "second", "third", "first", "next", "last", "left", "right",
  "top", "bottom", "upper", "lower", "middle", "red", "grey", "gray", "green",
  "blue", "dark", "pale", "long", "short", "big", "small", "whole", "two",
  "both", "each", "only", "single", "correct", "wrong", "new", "old",
]);
/**
 * Adjectives that describe how a mark is drawn rather than what it is called.
 * "the dashed line" is a fair description of a real line; "the vacancy line"
 * is a claim that something called vacancy is on screen.
 */
const DESCRIBES_A_MARK =
  /^(falling|rising|dropping|climbing|dashed|dotted|solid|thin|thick|curved|straight|flat|steep|sloping|shaded|moving|shrinking|growing|coloured|colored|jagged|smooth)$|-(minute|minutes|second|seconds|hour|degree|percent|point|dollar|day|days|week|year)s?$/i;

/** A line that tells the learner to touch the model, rather than describing the room. */
const POINTS_AT_MODEL =
  /\b(drag|slide|move|tap|press|watch|model|below|slider|toggle)\b/i;

function rendersLabel(label: string): boolean {
  const trimmed = label.trim().replace(/[.,;:!?]+$/, "");
  if (!trimmed) return true;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped.replace(/\s+/g, "\\s+"), "i").test(SIM_SOURCE);
}

check("every control a guide quotes is really on screen", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      if (!scene.simGuide) continue;
      const at = `${story.id}/${scene.id}`;
      const guide = scene.simGuide;
      const sources: [string, string][] = [
        ["shows", guide.shows],
        ["move", guide.move],
        ["watch", guide.watch],
        // The same promise gets made in narration right above the model — but
        // only on lines that actually point at it. "Marta hovers over the red
        // quench button" is scenery; "drag the lever and watch the X line" is
        // an instruction, and an instruction can be wrong.
        ...scene.text
          .filter((line) => POINTS_AT_MODEL.test(line))
          .map((line, i) => [`text[${i}]`, line] as [string, string]),
      ];
      for (const [key, source] of sources) {
        for (const match of source.matchAll(QUOTED)) {
          const label = match[1];
          if (!rendersLabel(label)) {
            problems.push(
              `${at}: simGuide.${key} points at \u201c${label}\u201d, which "${scene.simulation}" never renders`,
            );
          }
        }
        for (const match of source.matchAll(NAMED_READOUT)) {
          const words = [match[1], match[2]].filter(Boolean) as string[];
          const named = words.filter(
            (w) => !GENERIC_READOUT.has(w.toLowerCase()) && !DESCRIBES_A_MARK.test(w),
          );
          for (const word of named) {
            if (!rendersLabel(word)) {
              problems.push(
                `${at}: ${key} names "the ${word} ${match[3]}", which "${scene.simulation}" never renders`,
              );
            }
          }
        }
      }
    }
  }
  allOf(problems, "phantom control(s)");
});

/**
 * The card is the only thing a learner sees before committing seven minutes.
 * A blurb that merely re-states the tagline wastes the one chance the story has
 * to say what it is actually about, and a missing alt text makes the grid
 * unreadable to anyone using a screen reader.
 */
check("every story sells itself on the card", () => {
  const problems: string[] = [];
  for (const story of allScenarios) {
    const words = wordCount(story.blurb);
    const sentences = sentencesOf(story.blurb).length;
    if (words < 22) {
      problems.push(`${story.id}: blurb is ${words} words — too thin to choose from`);
    }
    if (words > 62) {
      problems.push(`${story.id}: blurb is ${words} words — that is a synopsis, not a pitch`);
    }
    if (sentences < 2 || sentences > 3) {
      problems.push(`${story.id}: blurb runs ${sentences} sentence(s) — aim for two or three`);
    }
    const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();
    if (normalise(story.blurb).startsWith(normalise(story.tagline))) {
      problems.push(`${story.id}: blurb opens by repeating the tagline`);
    }
    if (wordCount(story.art.alt) < 6) {
      problems.push(`${story.id}: art.alt is too short to describe the artwork`);
    }
    if (story.art.src && !story.art.src.startsWith("/")) {
      problems.push(`${story.id}: art.src must be a root-relative path`);
    }
  }
  allOf(problems, "card problem(s)");
});

check("every simulation is introduced before it appears", () => {
  const setupCue =
    /\b(model|simulation|below|play|drag|move|watch|look|follow|hold|test|try)\b/i;
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      if (!scene.simulation) continue;
      assert.ok(
        "text" in scene && scene.text.some((line) => setupCue.test(line)),
        `${story.id}/${scene.id}: ${scene.simulation} appears without a plain-language setup sentence`,
      );
    }
  }
});

check("every scenario mixes decisions, tuning and ordering", () => {
  for (const story of allScenarios) {
    const kinds = story.scenes.map((s) => s.type);
    const count = (t: Scene["type"]) => kinds.filter((k) => k === t).length;
    assert.ok(count("choice") >= 4, `${story.id} has too few decisions`);
    assert.ok(count("slider") >= 1, `${story.id} has no tuning scene`);
    // One ordering beat, not two. This floor was set when stories ran to
    // thirteen minutes and could afford to ask for a sequence twice; at six
    // minutes the second one only ever restated the first in weaker words.
    assert.ok(count("reorder") >= 1, `${story.id} has no ordering beat`);
    assert.ok(count("reflect") >= 1, `${story.id} never asks for reasoning`);
    assert.equal(count("ending"), 1, `${story.id} needs exactly one ending`);
  }
});

check("reorder scenes are solvable and not pre-solved", () => {
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      if (scene.type !== "reorder") continue;
      const ids = scene.steps.map((s) => s.id);
      assert.ok(ids.length >= 4, `${story.id}/${scene.id} is too short`);
      assert.equal(
        new Set(ids).size,
        ids.length,
        `${story.id}/${scene.id} has duplicate step ids`,
      );
      for (const s of scene.steps) {
        assert.ok(s.label.trim().length > 8, `${scene.id} has a bare label`);
      }
      assert.ok(scene.wrong.trim().length > 20, `${scene.id} wrong text`);
      assert.ok(scene.right.trim().length > 20, `${scene.id} right text`);
      assert.ok(
        scene.instruction.trim().length > 10,
        `${scene.id} has no instruction`,
      );
      const shuffled = shuffledStepIds(scene);
      assert.deepEqual(
        [...shuffled].sort(),
        [...ids].sort(),
        `${scene.id} shuffle lost a step`,
      );
      assert.notDeepEqual(
        shuffled,
        ids,
        `${story.id}/${scene.id} opens already solved`,
      );
    }
  }
});

check("every scene is reachable from the start", () => {
  for (const story of allScenarios) {
    const seen = new Set<string>();
    const queue = [story.startScene];
    while (queue.length) {
      const id = queue.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const next of exits(getScene(story, id))) queue.push(next);
    }
    for (const scene of story.scenes) {
      assert.ok(seen.has(scene.id), `${story.id}/${scene.id} is unreachable`);
    }
  }
});

check("the slider target sits inside its own bands", () => {
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      if (scene.type !== "slider") continue;
      const where = `${story.id}/${scene.id}`;
      assert.ok(
        scene.target.min > scene.slider.min,
        `${where}: target starts at the floor`,
      );
      assert.ok(
        scene.target.max < scene.slider.max,
        `${where}: target ends at the ceiling`,
      );
      // The boundary must actually flip correctness, or the band is decorative.
      assert.ok(isSliderCorrect(scene, scene.target.min), where);
      assert.ok(!isSliderCorrect(scene, scene.target.min - 1), where);
      assert.ok(isSliderCorrect(scene, scene.target.max), where);
      assert.ok(!isSliderCorrect(scene, scene.target.max + 1), where);
      assert.ok(
        scene.bands.some((b) => b.max >= scene.slider.max),
        `${where}: the top of the range has no feedback band`,
      );
    }
  }
});

check("each ceiling slider's lower bound is the limit the story states", () => {
  for (const story of allScenarios) {
    for (const scene of story.scenes) {
      if (scene.type !== "slider" || scene.risk.mode !== "ceiling") continue;
      const where = `${story.id}/${scene.id}`;
      const at = (v: number) => readoutFor(scene, v);
      assert.ok(
        at(scene.target.min) < scene.driver.value,
        `${where}: the winning value still breaks the stated limit`,
      );
      assert.ok(
        at(scene.target.min - scene.slider.step) >= scene.driver.value,
        `${where}: the lower bound is looser than the story claims`,
      );
    }
  }
});

check("the physics matches the story's stated 0.25 Hz margin", () => {
  const scene = getScene(scenario, "s8");
  if (scene.type !== "slider") throw new Error("s8 is not the slider scene");
  const sep = (v: number) =>
    Math.abs(readoutFor(scene, v) - scene.driver.value);
  assert.ok(
    sep(scene.target.min) >= 0.25,
    `${scene.target.min}t only separates by ${sep(scene.target.min).toFixed(3)} Hz`,
  );
  assert.ok(
    sep(scene.target.min - 1) < 0.25,
    "the lower bound is looser than the story claims",
  );
});

/* ------------------------------------------------------------------ */
console.log("\nperfect run");

/**
 * The scripted runs below used to hard-code option ids and a move count. That
 * broke every time a scene was added or removed, which told us nothing about
 * the engine and cost a debugging session each time. Derive the flawless run
 * from the scenario instead, so the fixtures follow the story.
 */
function flawlessMoves(story: Scenario = scenario): Move[] {
  const byId = new Map(story.scenes.map((s) => [s.id, s]));
  const moves: Move[] = [];
  const seen = new Set<string>();
  let id: string | undefined = story.startScene;

  while (id && !seen.has(id)) {
    seen.add(id);
    const scene = byId.get(id);
    if (!scene) break;

    switch (scene.type) {
      case "choice": {
        const correct = scene.options.find((o) => o.correct);
        assert.ok(correct, `${story.id}/${scene.id} has no correct option`);
        moves.push(correct.id);
        id = correct.next;
        break;
      }
      case "slider": {
        moves.push(Math.round((scene.target.min + scene.target.max) / 2));
        id = scene.next;
        break;
      }
      case "reorder": {
        moves.push(OK);
        id = scene.next;
        break;
      }
      case "ending":
        id = undefined;
        break;
      default:
        id = scene.next;
    }
  }

  return moves;
}

/** The id of a wrong option on the first decision the learner meets. */
function firstWrongMove(story: Scenario = scenario): string {
  for (const scene of story.scenes) {
    if (scene.type !== "choice") continue;
    const wrong = scene.options.find((o) => !o.correct);
    if (wrong) return wrong.id;
  }
  throw new Error(`${story.id} has no wrong option to retry`);
}

const PERFECT_RUN: Move[] = flawlessMoves();

check("a flawless playthrough reaches the profile", () => {
  const { state, events } = play([...PERFECT_RUN], "");
  assert.equal(state.phase, "profile");
  assert.equal(state.notes.mistakes.length, 0);
  assert.equal(state.notes.decisions.filter((d) => !d.correct).length, 0);
  assert.ok(
    events.some((e) => e.kind === "key_decision"),
    "the probe on s2 never fired",
  );
});

check("a flawless run stays well inside the call budget", () => {
  const { events } = play([...PERFECT_RUN], "I isolated it.");
  const calls = countCalls(events);
  assert.ok(calls >= 1, "the partner was never consulted");
  assert.ok(calls <= 8, `${calls} calls is over the stated budget`);
});

/* ------------------------------------------------------------------ */
console.log("\nstruggling run");

check("wrong answers loop back without dead-ending", () => {
  const { state } = play(
    [
      "counterweight",
      "cables",
      "measure",
      "onelane",
      "close",
      "stronger",
      "phase",
      BAD,
      OK,
      10,
      25,
      40,
      "more",
      "remove",
      OK,
      "heavier",
      "damper",
    ],
    "The gusts stopped matching the deck.",
  );
  assert.equal(state.phase, "profile");
  assert.ok(state.notes.mistakes.length >= 4);
  assert.ok(
    state.notes.mistakes.every((m) => m.corrected),
    "mistakes were never marked corrected",
  );
  assert.ok(state.notes.selfCorrections >= 3);
});

check("a struggling run is capped at the call budget", () => {
  const { events } = play(
    [
      "counterweight",
      "cables",
      "designer",
      "measure",
      "onelane",
      "wait",
      "kiran",
      "close",
      "stronger",
      "fatigue",
      "cables2",
      "phase",
      BAD,
      BAD,
      OK,
      5,
      10,
      20,
      25,
      40,
      "more",
      "nothing",
      "remove",
      BAD,
      OK,
      "heavier",
      "forecast",
      "fairings",
    ],
    "Because the frequencies stopped lining up.",
  );
  const calls = countCalls(events);
  assert.ok(calls <= 6, `${calls} calls exceeds IN_SESSION_CALL_BUDGET`);
});

check("hints escalate and never exceed the ladder", () => {
  let state = initState(scenario.id);
  state = step(state, { type: "begin" }).state;
  state = step(state, { type: "presession", question: "q", answer: "a" }).state;

  // Walk to the first decision. The help affordance only exists there, so on
  // any narrative beat along the way asking for help must produce nothing.
  for (let guard = 0; guard < 20; guard += 1) {
    if (currentScene(state).type === "choice") break;
    assert.equal(
      step(state, { type: "help" }).event,
      null,
      `help produced an event on a "${currentScene(state).type}" beat`,
    );
    state = step(state, { type: "advance" }).state;
  }

  const decision = currentScene(state);
  assert.equal(decision.type, "choice", "never reached a decision scene");

  const seen: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const result = step(state, { type: "help" });
    state = result.state;
    if (!result.event || result.event.kind !== "help_request") {
      throw new Error("help did not produce a help_request event");
    }
    seen.push(result.event.hint);
  }
  if (decision.type !== "choice") throw new Error("not a choice scene");
  assert.deepEqual(seen.slice(0, 3), decision.hints);
  assert.equal(seen[3], decision.hints[2], "hint level ran past the ladder");
  assert.equal(state.notes.hintsUsed, 5);
});

/* ------------------------------------------------------------------ */
console.log("\nevery scenario is playable");

for (const story of allScenarios) {
  check(`${story.id}: a flawless run reaches the profile`, () => {
    const { state, events } = autoPlay(story, { struggle: false });
    assert.equal(state.phase, "profile");
    assert.equal(state.notes.mistakes.length, 0, "a clean run logged mistakes");
    assert.equal(state.notes.decisions.filter((d) => !d.correct).length, 0);
    assert.ok(state.notes.experiments.length >= 1, "the slider never resolved");
    assert.ok(
      events.some((e) => e.kind === "key_decision"),
      "no key decision was ever flagged",
    );
    assert.ok(countCalls(events) <= 6, "the call budget was blown");
  });

  check(`${story.id}: a struggling run still finishes`, () => {
    const { state, events } = autoPlay(story, { struggle: true });
    assert.equal(state.phase, "profile", "a wrong-first run dead-ended");
    assert.ok(state.notes.mistakes.length >= 4, "the run was too easy to fail");
    assert.ok(
      state.notes.mistakes.every((m) => m.corrected),
      "mistakes were never marked corrected",
    );
    assert.ok(state.notes.selfCorrections >= 4);
    assert.ok(countCalls(events) <= 6, "the call budget was blown");

    const profile = fallbackProfile({
      scenario: context(story),
      notes: digestNotes(state.notes),
      outcome: "success",
    });
    assert.ok(profile.archetype.length > 0);
    assert.ok(profile.noticed.length > 30);
  });

  check(`${story.id}: every engine event has an offline reply`, () => {
    const { events } = autoPlay(story, { struggle: true });
    const kinds = new Set(events.map((e) => e.kind));
    for (const expected of ["mistake", "self_correction", "experiment"]) {
      assert.ok(
        kinds.has(expected as EngineEvent["kind"]),
        `no ${expected} event`,
      );
    }
    for (const event of events) {
      const response = fallbackObserve(event, "a hint");
      assert.ok(
        response.message.trim().length > 0,
        `${event.kind} said nothing`,
      );
      assert.ok(response.fallback);
    }
  });
}

/* ------------------------------------------------------------------ */
console.log("\noffline partner");

check("every engine event has a deterministic response", () => {
  const { events } = play(
    [
      "counterweight",
      "measure",
      "close",
      "stronger",
      "phase",
      OK,
      10,
      40,
      "more",
      "remove",
      OK,
      "damper",
    ],
    "I moved the deck away from the wind.",
  );
  const kinds = new Set(events.map((e) => e.kind));
  for (const expected of [
    "mistake",
    "self_correction",
    "experiment",
    "reasoning",
  ]) {
    assert.ok(
      kinds.has(expected as EngineEvent["kind"]),
      `no ${expected} event`,
    );
  }
  for (const event of events) {
    const response = fallbackObserve(event, "a hint");
    assert.ok(response.message.trim().length > 0, `${event.kind} said nothing`);
    assert.ok(response.fallback);
    if (response.observation) {
      assert.ok(response.observation.evidence.trim().length > 0);
    }
  }
});

check("the deterministic profile is grounded in the session", () => {
  const { state } = play(
    [
      "counterweight",
      "measure",
      "close",
      "stronger",
      "phase",
      OK,
      10,
      40,
      "more",
      "remove",
      OK,
      "damper",
    ],
    "The counterweight moved the deck off the gust frequency.",
  );
  const profile = fallbackProfile({
    scenario: context(),
    notes: digestNotes(state.notes),
    outcome: "success",
  });
  assert.ok(profile.archetype.length > 0);
  assert.ok(profile.strength.evidence.length > 20);
  assert.ok(profile.blindSpot.evidence.length > 20);
  assert.equal(
    profile.stats.decisions,
    new Set(state.notes.decisions.map((d) => d.sceneId)).size,
    "stats count attempts instead of decision points",
  );
  assert.ok(profile.fallback);
  assert.ok(
    profile.noticed.length > 30,
    "the profile has nothing specific to say",
  );
});

check("the profile never claims iteration that didn't happen", () => {
  // A flawless run: measured first, committed the counterweight on attempt one.
  const { state } = play([...PERFECT_RUN], "Timing, not strength.");
  const notes = digestNotes(state.notes);
  assert.equal(
    notes.experiments.length,
    1,
    "this run should commit exactly once",
  );

  const profile = fallbackProfile({
    scenario: context(),
    notes,
    outcome: "success",
  });

  const claim = `${profile.blindSpot.title} ${profile.blindSpot.evidence}`;
  assert.ok(
    !/\battempts\b|\btimes\b|slow to commit/i.test(claim),
    `blind spot invents repeated attempts: "${claim}"`,
  );
});

check("a single retry is not reported as two wrong first moves", () => {
  // One wrong option on the first decision, corrected next attempt. Rest clean.
  const flawless = flawlessMoves();
  // Slider beats are logged as experiments, not decisions, so they don't count.
  const decisions = flawless.filter((m) => typeof m === "string").length;
  const { state } = play(
    [firstWrongMove(), ...flawless],
    "The weight moved the deck off the gust rhythm.",
  );
  const notes = digestNotes(state.notes);
  assert.equal(
    notes.decisions.length,
    decisions + 1,
    "this run should record one attempt per decision, plus the retry",
  );

  const profile = fallbackProfile({
    scenario: context(),
    notes,
    outcome: "success",
  });

  assert.equal(
    profile.stats.decisions,
    decisions,
    `${decisions} decision points were reached — attempts are being counted as decisions`,
  );
  assert.equal(
    profile.stats.decisions - profile.stats.firstTryCorrect,
    1,
    "only one first move was wrong",
  );
  assert.ok(
    !/wrong on 2 /.test(profile.blindSpot.evidence),
    `blind spot doubles a single retry: "${profile.blindSpot.evidence}"`,
  );
});

check("every archetype is reachable", () => {
  const base = digestNotes(initState(scenario.id).notes);
  const profileFor = (notes: ReturnType<typeof digestNotes>) =>
    fallbackProfile({ scenario: context(), notes, outcome: "success" })
      .archetype;

  const seen = new Set<string>();

  // Direct solver: clean run, no measuring, no iterating.
  seen.add(
    profileFor({
      ...base,
      decisions: [
        {
          scene: "s2",
          choice: "a",
          correct: true,
          attempt: 1,
          approach: "act_first",
        },
        {
          scene: "s4",
          choice: "b",
          correct: true,
          attempt: 1,
          approach: "seek_pattern",
        },
      ],
    }),
  );
  // Systematic experimenter.
  seen.add(
    profileFor({
      ...base,
      decisions: [
        {
          scene: "s2",
          choice: "a",
          correct: true,
          attempt: 1,
          approach: "measure_first",
        },
      ],
    }),
  );
  // Adaptive corrector.
  seen.add(profileFor({ ...base, selfCorrections: 2 }));
  // Collaborative thinker.
  seen.add(profileFor({ ...base, hintsUsed: 3 }));
  // Careful reasoner (the floor).
  seen.add(profileFor(base));

  assert.equal(
    seen.size,
    5,
    `only reached ${seen.size} archetypes: ${[...seen].join(", ")}`,
  );
});

check("a profile still renders from an empty session", () => {
  const profile = fallbackProfile({
    scenario: context(),
    notes: digestNotes(initState(scenario.id).notes),
    outcome: "partial",
  });
  assert.ok(profile.archetype.length > 0);
  assert.ok(Number.isFinite(profile.score));
});

/* ------------------------------------------------------------------ */

console.log(
  failures === 0 ? "\nall checks passed\n" : `\n${failures} check(s) failed\n`,
);
process.exit(failures === 0 ? 0 : 1);

/* ------------------------------------------------------------------ */

function context(story: Scenario = scenario) {
  return {
    id: story.id,
    title: story.title,
    domain: story.domain,
    learningGoal: story.learningGoal,
    role: story.intro.role,
    greeting: story.partnerGreeting,
  };
}

function exits(scene: Scene): string[] {
  switch (scene.type) {
    case "narrative":
    case "reflect":
    case "slider":
    case "reorder":
      return [scene.next];
    case "choice":
      return scene.options.map((o) => o.next);
    case "ending":
      return [];
  }
}

/** Drives the engine with a script of option ids and slider values. */
function play(
  moves: Move[],
  reflection: string,
  story: Scenario = scenario,
): { state: PlayState; events: EngineEvent[] } {
  const scenario = story;
  let state = initState(scenario.id);
  const events: EngineEvent[] = [];

  const run = (action: Action) => {
    const result = step(state, action);
    state = result.state;
    if (result.event) events.push(result.event);
  };

  run({ type: "begin" });
  run({
    type: "presession",
    question: scenario.preSession.prompt,
    answer: scenario.preSession.options[0].label,
    approach: scenario.preSession.options[0].approach,
  });

  const queue = [...moves];
  for (let guard = 0; guard < 200; guard += 1) {
    if (state.phase === "profile") break;

    if (state.pending) {
      run({ type: "advance" });
      continue;
    }

    const scene = currentScene(state);
    switch (scene.type) {
      case "narrative":
      case "ending":
        run({ type: "advance" });
        break;
      case "reflect":
        run({ type: "reflect", answer: reflection });
        break;
      case "choice": {
        const move = queue.shift();
        assert.equal(
          typeof move,
          "string",
          `ran out of moves at choice ${scene.id}`,
        );
        run({ type: "choose", optionId: move as string });
        break;
      }
      case "slider": {
        const move = queue.shift();
        assert.equal(
          typeof move,
          "number",
          `ran out of moves at slider ${scene.id}`,
        );
        run({ type: "commit", value: move as number });
        break;
      }
      case "reorder": {
        const move = queue.shift();
        assert.ok(
          move === OK || move === BAD,
          `ran out of moves at reorder ${scene.id}`,
        );
        const order = scene.steps.map((s) => s.id);
        if (move === BAD) [order[0], order[1]] = [order[1], order[0]];
        run({ type: "reorder", order });
        break;
      }
    }
  }

  assert.equal(queue.length, 0, `unused moves: ${queue.join(", ")}`);
  return { state, events };
}


/**
 * Solves a scenario without a hand-written script: it reads the correct answer
 * out of the scene. `struggle` makes it burn one wrong answer everywhere first,
 * which is how we prove no beat can dead-end.
 */
function autoPlay(
  story: Scenario,
  { struggle }: { struggle: boolean },
): { state: PlayState; events: EngineEvent[] } {
  let state = initState(story.id);
  const events: EngineEvent[] = [];
  const failed = new Set<string>();

  const run = (action: Action) => {
    const result = step(state, action);
    state = result.state;
    if (result.event) events.push(result.event);
  };

  const shouldFail = (id: string) => {
    if (!struggle || failed.has(id)) return false;
    failed.add(id);
    return true;
  };

  run({ type: "begin" });
  run({
    type: "presession",
    question: story.preSession.prompt,
    answer: story.preSession.options[0].label,
    approach: story.preSession.options[0].approach,
  });

  for (let guard = 0; guard < 400; guard += 1) {
    if (state.phase === "profile") break;
    if (state.pending) {
      run({ type: "advance" });
      continue;
    }

    const scene = currentScene(state);
    switch (scene.type) {
      case "narrative":
      case "ending":
        run({ type: "advance" });
        break;
      case "reflect":
        run({ type: "reflect", answer: story.learningGoal });
        break;
      case "choice": {
        const want = shouldFail(scene.id)
          ? scene.options.find((o) => !o.correct)
          : scene.options.find((o) => o.correct);
        assert.ok(want, `${story.id}/${scene.id} has no usable option`);
        run({ type: "choose", optionId: want.id });
        break;
      }
      case "slider": {
        const value = shouldFail(scene.id)
          ? scene.slider.min
          : stepAlignedTarget(scene);
        run({ type: "commit", value });
        break;
      }
      case "reorder": {
        const order = scene.steps.map((s) => s.id);
        if (shouldFail(scene.id)) [order[0], order[1]] = [order[1], order[0]];
        run({ type: "reorder", order });
        break;
      }
    }
  }

  assert.equal(state.phase, "profile", `${story.id} never reached the profile`);
  return { state, events };
}

/** The first value a learner can actually land on inside the safe band. */
function stepAlignedTarget(scene: Extract<Scene, { type: "slider" }>): number {
  const { min, step: size } = scene.slider;
  for (let v = min; v <= scene.slider.max; v += size) {
    if (v >= scene.target.min && v <= scene.target.max) return v;
  }
  throw new Error(`${scene.id}: no step lands inside the target band`);
}

function countCalls(events: EngineEvent[]): number {
  let used = 0;
  for (const event of events) {
    if (shouldConsultPartner(event, used)) used += 1;
  }
  return used;
}
