"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayState } from "@/lib/engine";
import type { Scenario } from "@/lib/story";
import { RECENT_STORY_BEATS_ON_SMALL_SCREENS } from "@/constants/story";
import { storyEmoji } from "@/utils/story-visual";
import { cardSoft } from "@/constants/ui";


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
  activeId,
  onSelect,
  className = "",
}: {
  scenario: Scenario;
  state: PlayState;
  /** The beat currently on screen — the live one, or the one being re-read. */
  activeId?: string;
  /** Reopen a beat the learner has already played. */
  onSelect?: (sceneId: string) => void;
  className?: string;
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
        emoji: storyEmoji(scene.visual.kind),
        context: scene.visual.caption,
        decision,
        experiment,
        reasoning,
        corrected,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const olderOnSmall = Math.max(
    0,
    entries.length - RECENT_STORY_BEATS_ON_SMALL_SCREENS,
  );

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // Only the tall desktop panel scrolls. Assigning scrollTop directly (rather
    // than scrollIntoView) keeps a new beat from yanking the whole page on
    // phones, where the panel sits above the story.
    const overflowing = list.scrollHeight > list.clientHeight + 1;
    setHasOlder(overflowing);
    if (overflowing) {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }
  }, [entries.length]);

  if (state.phase !== "scene") {
    return (
      <aside
        aria-label="Story brief"
        className={`${cardSoft} animate-rise flex flex-col rounded-2xl px-5 py-5 motion-reduce:animate-none ${className}`}
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
            <span aria-hidden className="mr-2">
              {storyEmoji(scenario.intro.visual.kind)}
            </span>
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
      className={`${cardSoft} animate-rise rounded-2xl px-5 pt-5 pb-4 motion-reduce:animate-none lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden ${className}`}
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
        className={`mt-4 pr-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto ${
          hasOlder
            ? "[mask-image:linear-gradient(to_bottom,transparent_0,#000_22px)]"
            : ""
        }`}
      >
        {olderOnSmall > 0 && (
          <li className="mb-4 pl-[22px] text-[12px] font-semibold text-ink/45 italic lg:hidden">
            {olderOnSmall} earlier beat{olderOnSmall > 1 ? "s" : ""} before this
          </li>
        )}
        {entries.map((entry, i) => {
          const last = i === entries.length - 1;
          const here = entry.id === (activeId ?? state.sceneId);
          // Phones get the recent stretch only. Clipping a scroll box mid-card
          // is what made this panel look broken, so small screens simply show
          // fewer beats instead of half of one.
          const foldedOnSmall =
            i < entries.length - RECENT_STORY_BEATS_ON_SMALL_SCREENS;
          const body = (
            <>
              <p
                className={
                  here
                    ? "flex items-start gap-1.5 text-[14.5px] leading-[1.4] font-extrabold text-ink italic"
                    : "flex items-start gap-1.5 text-[14.5px] leading-[1.4] font-semibold text-ink/70"
                }
              >
                <span aria-hidden className="shrink-0 not-italic">
                  {entry.emoji}
                </span>
                <span>{entry.beat}</span>
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
            </>
          );
          return (
            <li
              key={entry.id}
              className={`relative gap-3 pb-5 last:pb-0 ${
                foldedOnSmall ? "hidden lg:flex" : "flex"
              }`}
            >
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

              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(entry.id)}
                  title={last ? "You are here" : `Re-read: ${entry.beat}`}
                  className="-my-1 min-w-0 flex-1 cursor-pointer rounded-xl px-2 py-1 text-left transition hover:bg-accent/[0.06]"
                >
                  {body}
                </button>
              ) : (
                <div className="min-w-0 flex-1">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
