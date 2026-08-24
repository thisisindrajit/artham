"use client";

import { cardSoft } from "@/constants/ui";
import type { StoryContextPanelProps } from "@/types/components";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StoryRecap } from "@/components/story-recap";

/**
 * The context box, in the two places it can live.
 *
 * On a wide screen it is the second column, pinned beside the story so the
 * learner can glance at what has happened without leaving the beat they are on.
 *
 * A phone has no second column to give it, and folding it above the story is
 * what made it look broken before — so there it becomes a bottom sheet behind
 * one button and gets the full height it needs. The two share one `StoryRecap`,
 * so they cannot drift apart.
 */
export function StoryContextColumn({ scenario, state }: StoryContextPanelProps) {
  return (
    <aside
      aria-label="Story context and progress"
      className={`${cardSoft} sticky top-24 hidden max-h-[calc(100dvh-8rem)] rounded-2xl px-5 pt-5 pb-4 lg:flex lg:flex-col lg:overflow-hidden`}
    >
      <StoryRecap scenario={scenario} state={state} />
    </aside>
  );
}

export function StoryContextSheet({ scenario, state }: StoryContextPanelProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-2 self-start rounded-full border border-line bg-white px-4 py-2.5 text-[14px] font-bold text-ink shadow-[0_3px_0_rgba(23,23,23,0.1),0_12px_28px_rgba(23,23,23,0.14)] transition hover:border-accent/55 hover:bg-accent/10 lg:hidden"
        >
          <span aria-hidden>🧾</span>
          The story so far
          <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[12px] tabular-nums text-ink/70">
            {state.visited.length}
          </span>
        </button>
      </SheetTrigger>

      {/* The sheet portals onto <body>, outside the session's [data-domain]
          wrapper, so it has to carry the subject itself or every accent inside
          it falls back to the placeholder grey. */}
      <SheetContent
        data-domain={scenario.domain}
        side="bottom"
        className="flex max-h-[82dvh] flex-col rounded-t-3xl px-5 pt-5 pb-6"
      >
        <SheetTitle className="text-[12.5px] font-extrabold tracking-[0.16em] text-ink/70 uppercase">
          {scenario.title}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Everything that has happened in this story so far, and the choices you
          made.
        </SheetDescription>
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <StoryRecap scenario={scenario} state={state} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
