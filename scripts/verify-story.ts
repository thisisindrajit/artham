/**
 * Headless walkthrough of the deterministic story engine.
 *
 * Runs with no browser, no network and no agent: if this passes, the story is
 * playable with the partner completely offline, which is the reliability
 * guarantee the product depends on.
 */
import assert from "node:assert/strict";

import { resonanceBridge } from "../lib/story/scenarios/resonance-bridge";
import { getScene, scenarios as allScenarios } from "../lib/story/index";
import { shuffledStepIds } from "../lib/story/shuffle";
import type { Scenario, Scene, ScenePrimer } from "../lib/story/types";
import {
  currentScene,
  initState,
  shouldConsultPartner,
  step,
  type Action,
  type EngineEvent,
  type PlayState,
} from "../lib/engine/index";
import { isSliderCorrect, readoutFor } from "../lib/engine/formulas";
import { fallbackObserve, fallbackProfile } from "../lib/partner/fallbacks";
import { digest } from "../lib/partner/types";

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

check("every scenario mixes decisions, tuning and ordering", () => {
  for (const story of allScenarios) {
    const kinds = story.scenes.map((s) => s.type);
    const count = (t: Scene["type"]) => kinds.filter((k) => k === t).length;
    assert.ok(count("choice") >= 4, `${story.id} has too few decisions`);
    assert.ok(count("slider") >= 1, `${story.id} has no tuning scene`);
    assert.ok(count("reorder") >= 2, `${story.id} has too few reorder beats`);
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

const PERFECT_RUN: Move[] = [
  "measure",
  "close",
  "phase",
  OK, // s6b — order the resonance chain
  40,
  "remove",
  OK, // s12b — rank patch versus fix
  "damper",
];

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
  // s1 is narrative; the help affordance only exists on decision scenes.
  assert.equal(step(state, { type: "help" }).event, null);
  state = step(state, { type: "advance" }).state;
  assert.equal(currentScene(state).id, "s2");

  const seen: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const result = step(state, { type: "help" });
    state = result.state;
    if (!result.event || result.event.kind !== "help_request") {
      throw new Error("help did not produce a help_request event");
    }
    seen.push(result.event.hint);
  }
  const s2 = getScene(scenario, "s2");
  if (s2.type !== "choice") throw new Error("s2 is not a choice scene");
  assert.deepEqual(seen.slice(0, 3), s2.hints);
  assert.equal(seen[3], s2.hints[2], "hint level ran past the ladder");
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
      notes: digest(state.notes),
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
    notes: digest(state.notes),
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
  const notes = digest(state.notes);
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
  // One wrong option on s4, corrected on the next attempt. Everything else clean.
  const { state } = play(
    ["measure", "onelane", "close", "phase", OK, 40, "remove", OK, "damper"],
    "The weight moved the deck off the gust rhythm.",
  );
  const notes = digest(state.notes);
  assert.equal(notes.decisions.length, 8, "this run should record 8 attempts");

  const profile = fallbackProfile({
    scenario: context(),
    notes,
    outcome: "success",
  });

  assert.equal(
    profile.stats.decisions,
    7,
    "7 decision points were reached, not 8 — attempts are being counted",
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
  const base = digest(initState(scenario.id).notes);
  const profileFor = (notes: ReturnType<typeof digest>) =>
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
    notes: digest(initState(scenario.id).notes),
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
