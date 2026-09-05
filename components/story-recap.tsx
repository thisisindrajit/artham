"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayState } from "@/lib/engine";
import type { Scenario } from "@/lib/story";

/**
 * "The story so far."
 *
 * The story column is long by design, so this is the part a learner can hold
 * still: one line per beat they have reached, with the decision they made under
 * it. It is built from `state.visited` — beats recorded on *arrival* — rather
 * than from the scene list, so it never shows a branch they did not take, and
 * the decisions are their own, which makes it a record of *their* run rather
 * than a synopsis.
 *
 * Layout-free on purpose: it fills whatever box it is given. That box is a
 * sticky column on a wide screen and a bottom sheet on a phone.
 */
export function StoryRecap({
  scenario,
  state,
}: {
  scenario: Scenario;
  state: PlayState;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const current = scenario.scenes.findIndex((scene) => scene.id === state.sceneId);
  const progress = Math.max(
    0,
    Math.min(100, ((current + 1) / scenario.scenes.length) * 100),
  );

  const entries = state.visited
    .map((sceneId) => {
      const scene = scenario.scenes.find((s) => s.id === sceneId);
      if (!scene) return null;
      const decision = state.notes.decisions
        .filter((d) => d.sceneId === sceneId && d.correct)
        .at(-1);
      const experiment = state.notes.experiments
        .filter((item) => item.sceneId === sceneId && item.correct)
        .at(-1);
      const reasoning = state.notes.reasoningSamples
        .filter((item) => item.sceneId === sceneId)
        .at(-1);
      const corrected = state.notes.mistakes.some(
        (item) => item.sceneId === sceneId && item.corrected,
      );
      return {
        id: sceneId,
        beat: scene.beat,
        act: scene.act,
        context: scene.visual.caption,
        decision,
        experiment,
        reasoning,
        corrected,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // Assigning scrollTop directly (rather than scrollIntoView) keeps a new
    // beat from yanking the story column, which is the thing being read.
    const overflowing = list.scrollHeight > list.clientHeight + 1;
    setHasOlder(overflowing);
    if (overflowing) {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }
  }, [entries.length]);

  if (state.phase !== "scene") {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <p className="flex items-center gap-2 border-b border-line pb-4 text-[11.5px] font-extrabold tracking-[0.15em] text-ink/65 uppercase">
          <span className="size-1.5 shrink-0 rounded-full bg-accent" />
          Before you begin
        </p>

        <div className="mt-5">
          <p className="text-[11.5px] font-extrabold tracking-[0.15em] text-ink/55 uppercase">
            The situation
          </p>
          <p className="mt-2 text-[17px] leading-[1.45] font-semibold text-ink">
            {scenario.scenes[0]?.beat ?? scenario.title}
          </p>
          <p className="mt-2 text-[13px] leading-[1.45] text-ink/60">
            Opening chapter
          </p>
        </div>

        <dl className="mt-5 space-y-4 border-t border-line pt-5">
          <div>
            <dt className="text-[11.5px] font-extrabold tracking-[0.15em] text-ink/55 uppercase">
              Your role
            </dt>
            <dd className="mt-1 text-[14px] leading-[1.45] text-ink/75">
              You are the {scenario.intro.role}.
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-extrabold tracking-[0.15em] text-ink/55 uppercase">
              What you will learn
            </dt>
            <dd className="mt-1 text-[14px] leading-[1.5] text-ink/75">
              {scenario.learningGoal}
            </dd>
          </div>
        </dl>

        <p className="mt-5 rounded-xl bg-accent/[0.07] px-3.5 py-3 text-[12.5px] leading-[1.5] text-ink/65">
          As you play, this panel will remember the key clues, choices and tests
          for you.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-b border-line pb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] font-extrabold tracking-[0.15em] text-ink/65 uppercase">
            Chapter {entries.at(-1)?.act ?? 1} of 3
          </p>
          <p className="text-[11.5px] font-medium text-faint">
            {current + 1} / {scenario.scenes.length}
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[12.5px] font-extrabold tracking-[0.16em] text-ink/70 uppercase">
        <span className="mt-[1px] size-1.5 shrink-0 rounded-full bg-accent" />
        What has happened
      </p>

      {/* `overflow-y-auto` clips on both axes, so the ring around the current
          beat's dot needs its own gutter — otherwise its left edge is sliced
          flat against the scroll box. The negative margin gives that gutter
          back, keeping the dots aligned with the heading above. */}
      <ol
        ref={listRef}
        className={`-mx-1.5 mt-4 min-h-0 flex-1 overflow-y-auto px-1.5 ${
          hasOlder
            ? "[mask-image:linear-gradient(to_bottom,transparent_0,#000_22px)]"
            : ""
        }`}
      >
        {entries.map((entry, i) => {
          const last = i === entries.length - 1;
          const here = entry.id === state.sceneId;
          return (
            <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
              {/* The rail is positioned against the <li> padding box, not the
                  marker column, so it can cross the gap and land exactly on
                  the next dot instead of stopping short of it. */}
              {!last && (
                <span
                  aria-hidden
                  className="absolute top-[15px] -bottom-[5px] left-[5px] w-px -translate-x-1/2 bg-ink/15"
                />
              )}
              <span className="flex w-2.5 shrink-0 flex-col">
                <span
                  className={
                    here
                      ? "mt-[5px] size-2.5 rounded-full bg-accent ring-4 ring-accent/20"
                      : "mt-[5px] size-2.5 rounded-full border-2 border-ink/25 bg-white"
                  }
                />
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={
                    here
                      ? "flex items-start gap-1.5 text-[14.5px] leading-[1.4] font-extrabold text-ink italic"
                      : "flex items-start gap-1.5 text-[14.5px] leading-[1.4] font-semibold text-ink/70"
                  }
                >
                  <span>{entry.beat}</span>
                </p>
                <p className="mt-1 text-[13px] leading-[1.45] text-ink/65">
                  {entry.decision?.outcome ??
                    entry.experiment?.outcome ??
                    entry.context}
                </p>
                {entry.decision && (
                  <p className="mt-1.5 rounded-lg bg-accent/[0.07] px-2.5 py-2 text-[12.5px] leading-[1.4] text-ink/70 italic">
                    You chose: {entry.decision.choice}
                  </p>
                )}
                {entry.experiment && (
                  <p className="mt-1.5 rounded-lg bg-accent/[0.07] px-2.5 py-2 text-[12.5px] leading-[1.4] text-ink/70 italic">
                    You tested: {entry.experiment.value}
                  </p>
                )}
                {entry.reasoning && (
                  <p className="mt-1.5 rounded-lg bg-accent/[0.07] px-2.5 py-2 text-[12.5px] leading-[1.4] text-ink/70 italic">
                    You said: {entry.reasoning.answer}
                  </p>
                )}
                {entry.corrected && (
                  <p className="mt-1.5 text-[11.5px] font-semibold tracking-wide text-sage uppercase">
                    You revised an earlier try
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
