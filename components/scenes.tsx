"use client";

import { Fragment, useState } from "react";
import { DeckWave } from "./deck-wave";
import { StorySimulation } from "./story-simulation";
import { readoutFor, sliderRisk } from "@/lib/engine/formulas";
import { shuffledStepIds } from "@/lib/story/shuffle";
import { storyEmoji } from "@/lib/story/emoji";
import type {
  ChoiceScene,
  EndingScene,
  NarrativeScene,
  ReflectScene,
  ReorderScene,
  Scene,
  ScenePrimer,
  SceneTrivia,
  SessionNotes,
  SliderScene,
  StoryTakeaway,
} from "@/lib/story";
import {
  buttonPrimary,
  cardSoft,
  cardInteractive,
  storyIndex,
  storyOption,
  storyTag,
} from "@/lib/ui";

const STORY_PARTS =
  /(“[^”]+”|\$?[\d][\d,.]*(?:\s?(?:a\.m\.|p\.m\.|Hz|°C|t|L|k|%)(?!\p{L}))?)/gu;

/**
 * The story copy already contains the authorial cues we need. Dialogue gets
 * an italic voice; measurements and times become bold anchors. This keeps the
 * prose expressive without adding markup to every authored story line.
 */
function StoryCopy({ text }: { text: string }) {
  return (
    <>
      {text.split(STORY_PARTS).map((part, index) => {
        if (part.startsWith("“")) {
          return (
            <em key={index} className="font-semibold italic text-ink">
              {part}
            </em>
          );
        }
        if (/^\$?\d/.test(part)) {
          return (
            <strong key={index} className="font-extrabold tracking-tight text-ink">
              {part}
            </strong>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

export function Narration({ text }: { text: string[] }) {
  return (
    <div className="space-y-4">
      {text.map((line, i) => (
        <p
          key={i}
          className={`rise text-[17px] leading-[1.7] text-ink/85 ${
            i === 0 ? "font-medium" : ""
          }`}
          style={{ animationDelay: `${i * 110}ms` }}
        >
          <StoryCopy text={line} />
        </p>
      ))}
    </div>
  );
}

/**
 * The micro-lesson card.
 *
 * A story earns the right to say "marker" or "resonance" only after this card
 * has said what the word means without any other jargon in the sentence. It is
 * pinned into the flow rather than hidden behind a tooltip: a learner who has
 * to hunt for the definition has already lost the thread.
 *
 * Sized to sit inside the existing sheet — it adds a block, never width.
 */
export function PrimerCard({
  primer,
  delay = 0,
}: {
  primer: ScenePrimer | ScenePrimer[];
  delay?: number;
}) {
  const list = Array.isArray(primer) ? primer : [primer];
  return (
    <div className="space-y-5">
      {list.map((item, i) => (
        <aside
          key={item.term}
          className="rise relative -rotate-[0.4deg] rounded-2xl border-[1.5px] border-dashed border-accent/50 bg-accent/[0.07] px-5 pt-5 pb-4 shadow-[0_3px_0_rgb(var(--accent-rgb)/0.14),0_10px_24px_rgb(var(--accent-rgb)/0.08)]"
          style={{ animationDelay: `${delay + i * 140}ms` }}
        >
          <span className="absolute -top-3 left-5 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-accent/50 bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/70">
            <span aria-hidden>💡</span>
            In plain words
          </span>
          <p className="text-[16px] leading-[1.6] text-ink/85">
            <strong className="font-extrabold italic tracking-tight text-ink">
              {item.term}
            </strong>
            {" — "}
            {item.plain}
          </p>
          {item.like && (
            <p className="mt-2 text-[15px] italic leading-[1.55] text-ink/70">
              Think of it like {item.like}
            </p>
          )}
        </aside>
      ))}
    </div>
  );
}

/**
 * The page's own heading.
 *
 * The rail at the top of the window names the beat too, but in 13px uppercase
 * in a corner — which reads as chrome, not as part of the story. Repeating it
 * here, with the beat's emoji, gives every page a face and makes the sheet
 * feel like a page of a book rather than a form.
 */
export function SceneHeading({
  scene,
  className = "",
}: {
  scene: Scene;
  className?: string;
}) {
  return (
    <p
      className={`rise flex items-center gap-2 text-[13px] font-extrabold tracking-[0.14em] text-ink/55 uppercase ${className}`}
    >
      <span aria-hidden className="text-[17px] leading-none">
        {storyEmoji(scene.visual.kind)}
      </span>
      <span className="min-w-0 truncate">{scene.beat}</span>
    </p>
  );
}

/**
 * The "did you know" card.
 *
 * Deliberately the only block on the page a learner may skip with nothing
 * lost. It exists to buy a breath between decisions and to make the world feel
 * inhabited — the siege engine really was built, the bridge really did fall.
 * Styled unlike the primer on purpose: dashed orange means "you need this",
 * this soft slate card means "enjoy this".
 */
export function TriviaCard({
  trivia,
  delay = 0,
}: {
  trivia: SceneTrivia;
  delay?: number;
}) {
  return (
    <aside
      className="rise relative rotate-[0.35deg] rounded-2xl border-[1.5px] border-ink/12 bg-ink/[0.035] px-5 pt-5 pb-4 shadow-[0_3px_0_rgba(23,23,23,0.05)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="absolute -top-3 left-5 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink/15 bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-[0.14em] text-ink/60 uppercase">
        <span aria-hidden>{trivia.emoji}</span>
        Did you know
      </span>
      <p className="text-[15px] leading-[1.6] text-ink/80">
        <strong className="font-extrabold tracking-tight text-ink italic">
          {trivia.title}
        </strong>
        {" — "}
        <StoryCopy text={trivia.text} />
      </p>
    </aside>
  );
}

export function NarrativeView({
  scene,
  onAdvance,
}: {
  scene: NarrativeScene;
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && (
        <TriviaCard trivia={scene.trivia} delay={scene.text.length * 110} />
      )}
      <PrimaryButton
        onClick={onAdvance}
        delay={scene.text.length * 110 + (scene.trivia ? 260 : 120)}
        label="Continue"
      />
    </div>
  );
}

export function ChoiceView({
  scene,
  tried,
  busy,
  onChoose,
  onHelp,
  onPreview,
}: {
  scene: ChoiceScene;
  tried: string[];
  busy: boolean;
  onChoose: (optionId: string) => void;
  onHelp: () => void;
  onPreview: (message: string | null) => void;
}) {
  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && (
        <TriviaCard trivia={scene.trivia} delay={scene.text.length * 110} />
      )}
      {scene.primer && (
        <PrimerCard primer={scene.primer} delay={scene.text.length * 110} />
      )}
      {scene.simulation && <StorySimulation kind={scene.simulation} />}

      <div className="space-y-3">
        <span className={`${storyTag} rise inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic`}>
          <span aria-hidden className="mr-1.5 not-italic">🎯</span>
          Your move
        </span>
        <h2 className="rise text-[21px] font-bold tracking-tight text-ink">
          <StoryCopy text={scene.prompt} />
        </h2>
        <div className="grid gap-2.5">
          {scene.options.map((option, i) => {
            const spent = tried.includes(option.id);
            return (
              <button
                key={option.id}
                disabled={spent || busy}
                onClick={() => onChoose(option.id)}
                onMouseEnter={() =>
                  onPreview(
                    option.detail
                      ? `${option.label} — ${option.detail}`
                      : option.label,
                  )
                }
                onMouseLeave={() => onPreview(null)}
                onFocus={() =>
                  onPreview(
                    option.detail
                      ? `${option.label} — ${option.detail}`
                      : option.label,
                  )
                }
                onBlur={() => onPreview(null)}
                className={`${cardSoft} ${cardInteractive} ${storyOption} rise group rounded-2xl px-4 py-3.5 text-left ${
                  spent
                    ? "cursor-not-allowed opacity-35"
                    : "active:scale-[0.995]"
                }`}
                style={{ animationDelay: `${180 + i * 70}ms` }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`${storyIndex} grid size-8 shrink-0 place-items-center rounded-full text-[15px] font-extrabold italic transition group-hover:-rotate-6 group-hover:scale-105`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[16px] font-semibold text-ink">
                    <StoryCopy text={option.label} />
                  </span>
                  {spent && (
                    <span className="text-[12px] tracking-wider text-faint uppercase">
                      already tried
                    </span>
                  )}
                </span>
                {option.detail && (
                  <span className="mt-1 block pl-10 text-[15.5px] leading-relaxed text-muted">
                    <StoryCopy text={option.detail} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <HelpButton onClick={onHelp} busy={busy} />
    </div>
  );
}

export function SliderView({
  scene,
  busy,
  onCommit,
  onHelp,
  onPreview,
}: {
  scene: SliderScene;
  busy: boolean;
  onCommit: (value: number) => void;
  onHelp: () => void;
  onPreview: (message: string | null) => void;
}) {
  const [value, setValue] = useState(scene.slider.initial);

  // Reset to the scene's starting value when the scene changes.
  const [lastSceneId, setLastSceneId] = useState(scene.id);
  if (scene.id !== lastSceneId) {
    setLastSceneId(scene.id);
    setValue(scene.slider.initial);
  }

  const readout = readoutFor(scene, value);
  const risk = sliderRisk(scene, value);
  const gap =
    scene.risk.mode === "separation"
      ? Math.abs(readout - scene.driver.value)
      : scene.driver.value - readout;
  const gapLabel = scene.risk.mode === "separation" ? "Separation" : "Headroom";
  const gapSafe =
    scene.risk.mode === "separation" ? gap >= scene.risk.safeGap : gap > 0;

  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && (
        <TriviaCard trivia={scene.trivia} delay={scene.text.length * 110} />
      )}
      {scene.primer && (
        <PrimerCard primer={scene.primer} delay={scene.text.length * 110} />
      )}

      <div className={`${cardSoft} ${storyOption} rise overflow-hidden rounded-2xl`}>
        <SliderMeter scene={scene} risk={risk} readout={readout} />

        <div className="grid grid-cols-3 border-t border-line">
          <Metric
            label={scene.readout.label}
            value={readout.toFixed(scene.readout.decimals)}
            unit={scene.readout.unit}
            tone={risk > 0.72 ? "rose" : risk > 0.38 ? "accent" : "sage"}
          />
          <Metric
            label={scene.driver.label}
            value={scene.driver.value.toFixed(scene.readout.decimals)}
            unit={scene.driver.unit}
            tone="muted"
          />
          <Metric
            label={gapLabel}
            value={gap.toFixed(scene.readout.decimals)}
            unit={scene.driver.unit}
            tone={gapSafe ? "sage" : "rose"}
          />
        </div>

        <div className="space-y-2 px-5 pt-4 pb-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] tracking-[0.16em] text-muted uppercase">
              {scene.slider.label}
            </span>
            <span className={`font-mono tabular-nums text-[28px] font-light text-ink`}>
              {value}
              <span className="ml-1 text-[16px] text-muted">
                {scene.slider.unit}
              </span>
            </span>
          </div>
          <input
            type="range"
            className="deck-slider"
            style={
              {
                "--track": trackGradient(scene),
              } as React.CSSProperties
            }
            min={scene.slider.min}
            max={scene.slider.max}
            step={scene.slider.step}
            value={value}
            disabled={busy}
            onChange={(e) => {
              const nextValue = Number(e.target.value);
              setValue(nextValue);
              onPreview(
                `Trying ${nextValue}${scene.slider.unit} — ${scene.readout.label.toLowerCase()} ${readoutFor(
                  scene,
                  nextValue,
                ).toFixed(scene.readout.decimals)}${scene.readout.unit}`,
              );
            }}
          />
          <div className="flex justify-between text-[13px] text-faint">
            <span>
              {scene.slider.min}
              {scene.slider.unit}
            </span>
            <span>
              {scene.slider.max}
              {scene.slider.unit}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <span className={`${storyTag} inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic`}>
          <span aria-hidden className="mr-1.5 not-italic">🎛️</span>
          Tune it
        </span>
        <h2 className="text-[21px] font-bold tracking-tight text-ink">
          <StoryCopy text={scene.prompt} />
        </h2>
        <PrimaryButton
          onClick={() => onCommit(value)}
          label={`Set ${value}${scene.slider.unit}`}
          disabled={busy}
        />
      </div>

      <HelpButton onClick={onHelp} busy={busy} />
    </div>
  );
}


export function ReorderView({
  scene,
  busy,
  onSubmit,
  onHelp,
  onPreview,
}: {
  scene: ReorderScene;
  busy: boolean;
  onSubmit: (order: string[]) => void;
  onHelp: () => void;
  onPreview: (message: string | null) => void;
}) {
  const [order, setOrder] = useState(() => shuffledStepIds(scene));
  const [moved, setMoved] = useState<string | null>(null);

  const [lastSceneId, setLastSceneId] = useState(scene.id);
  if (scene.id !== lastSceneId) {
    setLastSceneId(scene.id);
    setOrder(shuffledStepIds(scene));
    setMoved(null);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setMoved(next[target]);
    onPreview(
      `Step ${target + 1}: ${scene.steps.find((s) => s.id === next[target])?.label ?? ""}`,
    );
  }

  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && (
        <TriviaCard trivia={scene.trivia} delay={scene.text.length * 110} />
      )}
      {scene.primer && (
        <PrimerCard primer={scene.primer} delay={scene.text.length * 110} />
      )}
      {scene.simulation && <StorySimulation kind={scene.simulation} />}

      <div className="space-y-3">
        <span className={`${storyTag} rise inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic`}>
          <span aria-hidden className="mr-1.5 not-italic">🧩</span>
          Put it in order
        </span>
        <h2 className="rise text-[21px] font-bold tracking-tight text-ink">
          <StoryCopy text={scene.prompt} />
        </h2>
        <p className="rise text-[15.5px] leading-relaxed text-muted">
          {scene.instruction}
        </p>

        <ol className="grid gap-2.5 pt-1">
          {order.map((id, i) => {
            const stepData = scene.steps.find((s) => s.id === id);
            if (!stepData) return null;
            return (
              <li
                key={id}
                className={`${cardSoft} ${storyOption} rise flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-transform duration-200 ${
                  moved === id ? "border-accent/45 bg-accent/8" : ""
                }`}
                style={{ animationDelay: `${180 + i * 70}ms` }}
              >
                <span
                  className={`${storyIndex} font-mono tabular-nums grid size-8 shrink-0 place-items-center rounded-full text-[15px] font-extrabold italic`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-medium text-ink">
                    <StoryCopy text={stepData.label} />
                  </span>
                  {stepData.detail && (
                    <span className="mt-0.5 block text-[15px] leading-relaxed text-muted">
                      <StoryCopy text={stepData.detail} />
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 flex-col gap-1">
                  <NudgeButton
                    dir="up"
                    label={`Move "${stepData.label}" earlier`}
                    disabled={busy || i === 0}
                    onClick={() => move(i, -1)}
                  />
                  <NudgeButton
                    dir="down"
                    label={`Move "${stepData.label}" later`}
                    disabled={busy || i === order.length - 1}
                    onClick={() => move(i, 1)}
                  />
                </span>
              </li>
            );
          })}
        </ol>

        <div className="pt-2">
          <PrimaryButton
            onClick={() => onSubmit(order)}
            label="Lock in this order"
            disabled={busy}
          />
        </div>
      </div>

      <HelpButton onClick={onHelp} busy={busy} />
    </div>
  );
}

export function ReflectView({
  scene,
  busy,
  onSubmit,
}: {
  scene: ReflectScene;
  busy: boolean;
  onSubmit: (answer: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const [lastSceneId, setLastSceneId] = useState(scene.id);
  if (scene.id !== lastSceneId) {
    setLastSceneId(scene.id);
    setDraft("");
  }

  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && (
        <TriviaCard trivia={scene.trivia} delay={scene.text.length * 110} />
      )}
      <div className="rise space-y-3" style={{ animationDelay: "160ms" }}>
        <p className={`${storyTag} inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic tracking-[0.12em] uppercase`}>
          <span aria-hidden className="mr-1.5 not-italic">💭</span>
          Quick thought
        </p>
        <p className="text-[17px] leading-relaxed text-ink/90">
          <StoryCopy text={scene.prompt} />
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder={scene.placeholder}
          className="w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-[16px] leading-relaxed text-ink shadow-inner outline-none placeholder:text-faint focus:border-accent/45 focus:ring-4 focus:ring-accent/10"
        />
        <div className="flex items-center gap-4">
          <PrimaryButton
            onClick={() => onSubmit(draft)}
            label="Continue"
            disabled={busy || !draft.trim()}
          />
          <button
            onClick={() => onSubmit("")}
            disabled={busy}
            className="text-[16px] text-faint transition hover:text-muted"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The last thing a learner sees before the profile. The profile is about *how
 * they think*; this is about *what they now know*. Without it a story is an
 * enjoyable hour that names nothing — the learner cannot say what they learned,
 * so they cannot notice the same idea the next time it turns up wearing
 * different clothes. Hence `elsewhere`: the concept is only worth carrying if
 * it is portable.
 */
export function TakeawayCard({
  takeaway,
  delay = 0,
}: {
  takeaway: StoryTakeaway;
  delay?: number;
}) {
  return (
    <section
      className="rise relative rounded-2xl border-[1.5px] border-accent/45 bg-accent/[0.06] px-6 pt-7 pb-6 shadow-[0_5px_0_rgb(var(--accent-rgb)/0.16),0_18px_38px_rgb(var(--accent-rgb)/0.10)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-accent/45 bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-[0.14em] text-ink/70 uppercase">
        <span aria-hidden>🧠</span>
        What you now know
      </span>

      <h3 className="text-[23px] leading-[1.2] font-extrabold tracking-tight text-ink italic">
        {takeaway.concept}
      </h3>
      <p className="mt-1 text-[13px] font-bold tracking-[0.14em] text-ink/70 uppercase">
        {takeaway.field}
      </p>

      <p className="mt-5 text-[17px] leading-[1.7] text-ink/85">
        {takeaway.inOneLine}
      </p>

      <p className="mt-4 border-l-[3px] border-accent/45 pl-4 text-[16px] leading-[1.65] text-ink/80 italic">
        {takeaway.rule}
      </p>

      <TakeawayList title="The same idea, elsewhere" items={takeaway.elsewhere} />
      <TakeawayList title="Where you used it tonight" items={takeaway.youUsedIt} />
    </section>
  );
}

function TakeawayList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6">
      <p className="text-[12.5px] font-extrabold tracking-[0.16em] text-ink/70 uppercase">
        {title}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[15.5px] leading-[1.6] text-ink/80">
            <span className="mt-[10px] size-1.5 shrink-0 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EndingView({
  scene,
  takeaway,
  onFinish,
}: {
  scene: EndingScene;
  takeaway: StoryTakeaway;
  onFinish: () => void;
}) {
  const base = scene.text.length * 110;
  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && <TriviaCard trivia={scene.trivia} delay={base} />}
      <TakeawayCard takeaway={takeaway} delay={base + 140} />
      <PrimaryButton
        onClick={onFinish}
        label="See what Artham noticed"
        delay={base + 320}
      />
    </div>
  );
}

/**
 * A page the learner has already played, reopened read-only.
 *
 * Going back must never mean *replaying*: the profile is built from what they
 * actually did, so a second run at a decision they already made would either
 * double-count or silently overwrite it. So the controls are gone and what
 * they chose is shown in their place. Re-reading is free; rewriting is not.
 */
export function ReviewView({
  scene,
  notes,
}: {
  scene: Scene;
  notes: SessionNotes;
}) {
  const decision = notes.decisions.filter((d) => d.sceneId === scene.id).at(-1);
  const experiment = notes.experiments
    .filter((e) => e.sceneId === scene.id)
    .at(-1);
  const said = notes.reasoningSamples
    .filter((r) => r.sceneId === scene.id)
    .at(-1);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className={`${storyTag} inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic`}
        >
          <span aria-hidden className="mr-1.5 not-italic">
            🔖
          </span>
          Looking back
        </span>
        <SceneHeading scene={scene} className="min-w-0" />
      </div>

      <Narration text={scene.text} />
      {scene.trivia && <TriviaCard trivia={scene.trivia} />}
      {"primer" in scene && scene.primer && <PrimerCard primer={scene.primer} />}

      {(decision || experiment || said) && (
        <div className="rounded-2xl border border-line bg-accent/[0.05] px-5 py-4">
          <p className="text-[11.5px] font-extrabold tracking-[0.15em] text-ink/60 uppercase">
            What you did here
          </p>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-[1.55] text-ink/80">
            {decision && <li>You chose: {decision.choice}</li>}
            {experiment && <li>You settled on: {experiment.value}</li>}
            {said && <li>You said: {said.answer}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Page turner for beats the learner has already reached.
 *
 * "Next" only lights up while looking back, because forward through *unplayed*
 * story is not navigation — it is the decision on the page, and skipping it
 * would leave the profile describing a run that never happened.
 */
export function StoryNav({
  index,
  total,
  reviewing,
  onBack,
  onNext,
}: {
  index: number;
  total: number;
  reviewing: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const canBack = index > 0;
  const canNext = reviewing;
  return (
    <div className="mt-9 flex items-center justify-between gap-3 border-t border-line pt-4">
      <NavButton
        dir="back"
        label="Previous"
        disabled={!canBack}
        onClick={onBack}
      />
      <span className="text-center text-[11.5px] font-semibold tracking-[0.12em] text-faint uppercase">
        Page {index + 1} of {total}
      </span>
      <NavButton
        dir="next"
        label={reviewing && index === total - 2 ? "Catch up" : "Next"}
        disabled={!canNext}
        onClick={onNext}
      />
    </div>
  );
}

function NavButton({
  dir,
  label,
  disabled,
  onClick,
}: {
  dir: "back" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[14px] font-bold text-muted shadow-[0_2px_0_rgba(23,23,23,0.08)] transition hover:-translate-y-0.5 hover:border-accent/55 hover:bg-accent/10 hover:text-ink active:translate-y-0 active:shadow-none disabled:pointer-events-none disabled:opacity-30"
    >
      {dir === "back" && (
        <span
          aria-hidden
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        >
          ←
        </span>
      )}
      {label}
      {dir === "next" && (
        <span
          aria-hidden
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        >
          →
        </span>
      )}
    </button>
  );
}

export function ConsequenceView({
  text,
  correct,
  onAdvance,
}: {
  text: string;
  correct: boolean;
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-8">
      <div
        className={`slide-up -rotate-[0.35deg] rounded-2xl border-[1.5px] px-6 py-5 shadow-[0_5px_0_rgba(23,23,23,0.08),0_18px_38px_rgba(23,23,23,0.08)] ${
          correct
            ? "border-sage/25 bg-sage/10"
            : "border-rose/25 bg-rose/10"
        }`}
      >
        <p className="mb-2 text-[13px] font-extrabold italic tracking-[0.16em] text-ink/75 uppercase">
          <span aria-hidden className="mr-1.5 not-italic">
            {correct ? "✅" : "⚠️"}
          </span>
          {correct ? "That worked" : "Meanwhile…"}
        </p>
        <p className="text-[17px] leading-[1.7] text-ink/85">
          <StoryCopy text={text} />
        </p>
      </div>
      <PrimaryButton onClick={onAdvance} label="Continue" delay={220} />
    </div>
  );
}

/* -------------------- shared bits -------------------- */

function PrimaryButton({
  onClick,
  label,
  delay = 0,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  delay?: number;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-press="deep"
      className={`${buttonPrimary} group rise inline-flex items-center gap-3 rounded-full px-6 py-3 text-[16px] font-bold italic disabled:cursor-not-allowed disabled:opacity-30`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className="not-italic transition-transform duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </button>
  );
}

function HelpButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="rise text-[15px] font-bold italic text-muted underline decoration-2 decoration-accent/55 underline-offset-4 transition hover:text-ink disabled:opacity-40"
      style={{ animationDelay: "500ms" }}
    >
      Give me a tiny clue
    </button>
  );
}


function NudgeButton({
  dir,
  label,
  disabled,
  onClick,
}: {
  dir: "up" | "down";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg border border-line bg-white text-muted shadow-[0_2px_0_rgba(23,23,23,0.1)] transition hover:-translate-y-0.5 hover:border-accent/55 hover:bg-accent/10 hover:text-ink active:shadow-none disabled:cursor-not-allowed disabled:opacity-25"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
        <path
          d={dir === "up" ? "M8 3.5 L13 10 L3 10 Z" : "M8 12.5 L3 6 L13 6 Z"}
          fill="currentColor"
        />
      </svg>
    </button>
  );
}

/** The instrument above the slider track. One per scene family. */
function SliderMeter({
  scene,
  risk,
  readout,
}: {
  scene: SliderScene;
  risk: number;
  readout: number;
}) {
  if (scene.meter === "wave") {
    return (
      <div className="h-20 w-full bg-accent/6">
        <DeckWave amplitude={risk} className="h-full w-full" />
      </div>
    );
  }

  const tone =
    risk > 0.72 ? "var(--color-rose)"
    : risk > 0.38 ? "var(--color-accent)"
    : "var(--color-sage)";

  if (scene.meter === "thermometer") {
    const span = scene.driver.value * 1.15;
    const fill = Math.max(0, Math.min(100, (readout / span) * 100));
    const limit = (scene.driver.value / span) * 100;
    return (
      <div className="space-y-2 bg-accent/6 px-5 py-5">
        <div className="relative h-5 w-full overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full transition-[width,background-color] duration-300"
            style={{ width: `${fill}%`, background: tone }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-ink/45"
            style={{ left: `${limit}%` }}
          />
        </div>
        <div className="flex justify-between text-[12.5px] text-faint">
          <span>batch temperature</span>
          <span>
            {scene.driver.label} {scene.driver.value}
            {scene.driver.unit}
          </span>
        </div>
      </div>
    );
  }

  if (scene.meter === "crowd") {
    // An exponential readout pinned to a bar is unreadable; people are not.
    const dots = Math.max(0, Math.min(48, Math.round(readout)));
    const alone = readout < 1;
    return (
      <div className="bg-accent/6 px-5 py-5">
        <div
          className="flex min-h-14 flex-wrap content-center items-center gap-1.5"
          role="img"
          aria-label={
            alone
              ? "Fewer than one person still matches this profile"
              : `About ${Math.round(readout).toLocaleString()} people still match this profile`
          }
        >
          {alone ?
            <span className="flex items-center gap-2.5">
              <span className="size-3.5 rounded-full bg-sage" />
              <span className="text-[14px] font-semibold text-ink">
                one person left
              </span>
            </span>
          : <>
              {Array.from({ length: dots }).map((_, i) => (
                <span
                  key={i}
                  className="size-3.5 rounded-full"
                  style={{ background: tone }}
                />
              ))}
              {readout > 48 && (
                <span
                  className="self-center pl-1 text-[13px] font-semibold"
                  style={{ color: tone }}
                >
                  + {(Math.round(readout) - 48).toLocaleString()} more
                </span>
              )}
            </>
          }
        </div>
        <div className="mt-3 flex justify-between text-[12.5px] text-faint">
          <span>{scene.readout.label}</span>
          <span>
            {scene.driver.label} {scene.driver.value}
            {scene.driver.unit}
          </span>
        </div>
      </div>
    );
  }

  // market / gauge: a bar read against the line that must not be crossed
  const span = scene.driver.value * 2;
  const fill = Math.max(0, Math.min(100, (readout / span) * 100));
  const limit = 50;
  return (
    <div className="space-y-2 bg-accent/6 px-5 py-5">
      <div className="relative h-5 w-full overflow-hidden rounded-full bg-ink/8">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-300"
          style={{ width: `${fill}%`, background: tone }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-ink/45"
          style={{ left: `${limit}%` }}
        />
      </div>
      <div className="flex justify-between text-[12.5px] text-faint">
        <span>{scene.meter === "gauge" ? scene.readout.label : "market rent"}</span>
        <span>
          {scene.driver.label} {scene.driver.value}
          {scene.driver.unit}
        </span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "rose" | "accent" | "sage" | "muted";
}) {
  const color = {
    rose: "text-rose",
    accent: "text-ink",
    sage: "text-sage",
    muted: "text-ink/70",
  }[tone];
  return (
    <div className="border-r border-line px-4 py-3 last:border-r-0">
      <p className="mb-1 text-[12px] leading-tight tracking-[0.14em] text-faint uppercase">
        {label}
      </p>
      <p
        className={`font-mono tabular-nums text-[21px] font-light transition-colors ${color}`}
      >
        {value}
        <span className="ml-0.5 text-[14px] text-faint">{unit}</span>
      </p>
    </div>
  );
}

/**
 * Marks only the constraint the story already told the learner about (the
 * anchorage load limit). The lower bound is the thing they have to derive, so
 * it is deliberately not drawn.
 */
function trackGradient(scene: SliderScene): string {
  const span = scene.slider.max - scene.slider.min;
  const limit = ((scene.target.max - scene.slider.min) / span) * 100;
  return `linear-gradient(90deg, rgba(23,23,23,0.18) 0%, rgba(23,23,23,0.18) ${limit}%, rgba(179,38,30,0.5) ${limit}%)`;
}
