/**
 * Author's tool, not a gate: prints the reading estimate the verify script
 * enforces, so a story can be trimmed without guessing. Run: npx tsx scripts/budget.ts
 */
import { scenarios } from "../lib/story/index";
import type { Scenario, Scene } from "../types/story";

const wc = (s?: string) => (s ? s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0);
const primersOf = (scene: Scene) =>
  !scene.primer ? [] : Array.isArray(scene.primer) ? scene.primer : [scene.primer];

function words(story: Scenario) {
  let n = 0;
  const add = (...t: (string | undefined)[]) => t.forEach((x) => (n += wc(x)));
  add(story.intro.role, ...story.intro.text, story.intro.cta);
  add(story.preSession.prompt, ...story.preSession.options.map((o) => o.label));
  add(story.takeaway.inOneLine, story.takeaway.rule, ...story.takeaway.elsewhere, ...story.takeaway.youUsedIt);
  const perScene: [string, number][] = [];
  for (const scene of story.scenes) {
    const before = n;
    add(...((scene as { text?: string[] }).text ?? []));
    for (const p of primersOf(scene)) add(p.term, p.plain, p.like);
    if (scene.trivia) add(scene.trivia.title, scene.trivia.text);
    if (scene.simGuide) add(scene.simGuide.shows, scene.simGuide.move, scene.simGuide.watch);
    if (scene.type === "choice") {
      add(scene.prompt, ...scene.options.flatMap((o) => [o.label, o.detail]));
      add(scene.options.find((o) => o.correct)?.outcome);
    }
    if (scene.type === "slider") {
      add(scene.prompt, scene.slider.label, scene.readout.label, scene.driver.label, ...scene.bands.map((b) => b.text));
    }
    if (scene.type === "reorder") {
      add(scene.prompt, scene.instruction, scene.right, ...scene.steps.flatMap((s) => [s.label, s.detail]));
    }
    if (scene.type === "reflect") add(scene.prompt, scene.placeholder);
    perScene.push([`${scene.id}:${scene.type}`, n - before]);
  }
  return { total: n, perScene };
}

const INTERACTIVE = new Set(["choice", "slider", "reorder", "reflect"]);
const detail = process.argv.includes("--scenes");

for (const story of scenarios) {
  const { total, perScene } = words(story);
  const acts = story.scenes.filter((s) => INTERACTIVE.has(s.type)).length;
  const est = Math.round(total / 220 + acts * 0.17);
  const room = Math.floor((7.49 - acts * 0.17) * 220) - total;
  console.log(
    `${story.id.padEnd(18)} ${String(story.scenes.length).padStart(2)} scenes  ${String(total).padStart(4)} words  ${acts} interactions  →  ${est} min (label ${story.minutes})  ${room >= 0 ? "room " + room : "OVER by " + -room}`,
  );
  if (detail) for (const [id, n] of perScene) console.log(`    ${id.padEnd(16)} ${n}`);
}
