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
}: {
  scenario: Scenario;
  state: PlayState;
}) {
  const listRef = useRef<HTMLOListElement>(null);

  const entries = state.visited
    .map((sceneId) => {
      const scene = scenario.scenes.find((s) => s.id === sceneId);
      if (!scene) return null;
      const decision = state.notes.decisions
        .filter((d) => d.sceneId === sceneId && d.correct)
        .at(-1);
      return { id: sceneId, beat: scene.beat, act: scene.act, decision };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [entries.length]);

  // One beat is not a story yet — the panel would only be noise.
  if (entries.length < 2) return null;

  return (
    <aside
      className={`${cardSoft} rise mt-6 rounded-2xl px-5 pt-5 pb-4 lg:flex lg:min-h-[7rem] lg:flex-1 lg:flex-col lg:overflow-hidden`}
      style={{ animationDelay: "260ms" }}
    >
      <p className="flex items-center gap-2 text-[12.5px] font-extrabold tracking-[0.16em] text-ink/70 uppercase">
        <span className="mt-[1px] size-1.5 shrink-0 rounded-full bg-accent" />
        The story so far
      </p>

      <ol
        ref={listRef}
        className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1"
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
                      ? "text-[15.5px] leading-[1.45] font-extrabold text-ink italic"
                      : "text-[15.5px] leading-[1.45] font-semibold text-ink/70"
                  }
                >
                  {entry.beat}
                </p>
                {entry.decision && (
                  <p className="mt-0.5 line-clamp-2 text-[14px] leading-[1.45] text-ink/70 italic">
                    You chose: {entry.decision.choice}
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
