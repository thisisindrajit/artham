"use client";

import { useEffect, useRef } from "react";
import type { PlayState } from "@/lib/engine";
import type { Scenario } from "@/lib/story";
import { cardSoft } from "@/lib/ui";

/**
 * "The story so far."
 *
 * A story told one page at a time asks the learner to hold six or seven beats
 * in their head while also doing the thinking. This is the page they can look
 * back at, so working memory goes on the problem instead of the plot.
 *
 * It is built from `state.visited` — beats recorded on *arrival* — rather than
 * from the scene list, so it never shows a branch the learner did not take. The
 * decision under each beat is the learner's own correct choice, which is what
 * makes it a record of *their* run rather than a synopsis.
 */
export function StoryRecap({
  scenario,
  state,
  className = "",
}: {
  scenario: Scenario;
  state: PlayState;
  className?: string;
}) {
  const listRef = useRef<HTMLOListElement>(null);
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
    listRef.current?.lastElementChild?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [entries.length]);

  if (state.phase !== "scene") {
    return (
      <aside
        aria-label="Story brief"
        className={`${cardSoft} rise flex flex-col rounded-2xl px-5 py-5 ${className}`}
        style={{ animationDelay: "180ms" }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
          <p className="flex items-center gap-2 text-[11.5px] font-extrabold tracking-[0.15em] text-ink/65 uppercase">
            <span className="size-1.5 shrink-0 rounded-full bg-accent" />
            Before you begin
          </p>
          <p className="text-[11.5px] font-medium text-faint">
            {scenario.minutes} min · {scenario.difficulty}
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[11.5px] font-extrabold tracking-[0.15em] text-ink/55 uppercase">
            The situation
          </p>
          <p className="mt-2 text-[17px] leading-[1.45] font-semibold text-ink">
            {scenario.intro.visual.caption}
          </p>
          <p className="mt-2 text-[13px] leading-[1.45] text-ink/60">
            {scenario.intro.visual.status}
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
      </aside>
    );
  }

  return (
    <aside
      aria-label="Story context and progress"
      className={`${cardSoft} rise rounded-2xl px-5 pt-5 pb-4 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden ${className}`}
      style={{ animationDelay: "260ms" }}
    >
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

      <ol
        ref={listRef}
        className="mt-4 max-h-64 space-y-4 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1"
      >
        {entries.map((entry, i) => {
          const here = i === entries.length - 1;
          return (
            <li key={entry.id} className="relative flex gap-3">
              <span className="flex flex-col items-center">
                <span
                  className={
                    here
                      ? "mt-[7px] size-2.5 shrink-0 rounded-full bg-accent ring-4 ring-accent/20"
                      : "mt-[7px] size-2.5 shrink-0 rounded-full border-2 border-ink/25 bg-white"
                  }
                />
                {i < entries.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-ink/15" />
                )}
              </span>

              <div className="min-w-0 pb-0.5">
                <p
                  className={
                    here
                      ? "text-[14.5px] leading-[1.4] font-extrabold text-ink italic"
                      : "text-[14.5px] leading-[1.4] font-semibold text-ink/70"
                  }
                >
                  {entry.beat}
                </p>
                <p className="mt-1 text-[13px] leading-[1.45] text-ink/65">
                  {entry.decision?.outcome ??
                    entry.experiment?.outcome ??
                    entry.context}
                </p>
                {entry.decision && (
                  <p className="mt-1.5 line-clamp-2 rounded-lg bg-accent/[0.07] px-2.5 py-2 text-[12.5px] leading-[1.4] text-ink/70 italic">
                    You chose: {entry.decision.choice}
                  </p>
                )}
                {entry.experiment && (
                  <p className="mt-1.5 rounded-lg bg-accent/[0.07] px-2.5 py-2 text-[12.5px] leading-[1.4] text-ink/70 italic">
                    You tested: {entry.experiment.value}
                  </p>
                )}
                {entry.reasoning && (
                  <p className="mt-1.5 line-clamp-2 rounded-lg bg-accent/[0.07] px-2.5 py-2 text-[12.5px] leading-[1.4] text-ink/70 italic">
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
    </aside>
  );
}
