"use client";

import { useEffect, useRef } from "react";
import type { StoryFlowProps } from "@/types/components";
import type { Scene } from "@/lib/story";
import { SessionIntro } from "./session-intro";
import { SessionPrelude } from "./session-prelude";
import { StoryBeat } from "./story-beat";

/**
 * The story as one continuous page.
 *
 * It used to be a deck: one beat at a time, replaced on every click, with a
 * Previous button to page backwards. That turned out to be the thing making the
 * stories feel disjointed — a learner four decisions in could not see the four
 * decisions, only the current card, so every new beat arrived with no visible
 * cause. Reading back meant leaving the beat you were on.
 *
 * So nothing is ever taken away. Each answered beat stays exactly where it
 * happened, the next one is appended below it, and looking back is just
 * scrolling. The page is the transcript.
 */
export function StoryFlow({
  scenario,
  state,
  prelude,
  busy,
  barHeight,
  run,
}: StoryFlowProps) {
  const liveRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const settled = useRef(false);

  // Bring newly appended content into view. Skipped on the very first paint,
  // where there is nothing new and scrolling would only steal the top of the
  // briefing.
  useEffect(() => {
    if (!settled.current) {
      settled.current = true;
      return;
    }
    liveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.sceneId, state.phase]);

  // Also re-run when the bar grows: the partner card arrives a moment after the
  // answer does, and without this it would rise over the button just scrolled
  // into view.
  useEffect(() => {
    if (!state.pending) return;
    tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state.pending, barHeight]);

  const beats = playedBeats(scenario.scenes, state.visited, state.sceneId);
  const started = state.phase !== "intro";

  return (
    <div className="space-y-12">
      <SessionIntro
        scenario={scenario}
        started={started}
        onBegin={() => run({ type: "begin" })}
      />

      {started && (
        <div ref={state.phase === "presession" ? liveRef : undefined}>
          <SessionPrelude
            scenario={scenario}
            prelude={prelude}
            answered={state.notes.preSessionAnswer}
            onAnswer={(question, answer, approach) =>
              run({ type: "presession", question, answer, approach })
            }
          />
        </div>
      )}

      {state.phase === "scene" &&
        beats.map((scene, index) => {
          const live = scene.id === state.sceneId;
          const newChapter = scene.act !== beats[index - 1]?.act;
          return (
            <div
              key={scene.id}
              ref={live ? liveRef : undefined}
              className="space-y-12"
            >
              {newChapter && <ChapterRule act={scene.act} />}
              <StoryBeat
                scenario={scenario}
                state={state}
                scene={scene}
                live={live}
                busy={busy}
                run={run}
              />
            </div>
          );
        })}

      {/* Scroll anchor for a new consequence. Its scroll margin is the floating
          bar's height, so `block: "end"` stops above the bar rather than
          tucking the button the learner needs underneath it. */}
      <div
        ref={tailRef}
        aria-hidden
        className="h-px scroll-mb-[var(--session-bar)]"
      />
    </div>
  );
}

/**
 * Beats the learner has actually reached, in the order they reached them,
 * cut off at the one they are standing on.
 *
 * Filtered against the scene list so a stale id can never index past the end,
 * and cut at the live beat so a loop back to an earlier scene cannot leave
 * later blocks stranded below it.
 */
function playedBeats(
  scenes: Scene[],
  visited: string[],
  liveId: string,
): Scene[] {
  const trail = visited
    .map((id) => scenes.find((scene) => scene.id === id))
    .filter((scene): scene is Scene => scene !== undefined);
  const live = trail.findIndex((scene) => scene.id === liveId);
  return live === -1 ? trail : trail.slice(0, live + 1);
}

/** A visible seam between acts, so a long page still has three chapters in it. */
function ChapterRule({ act }: { act: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-4" role="separator">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11.5px] font-extrabold tracking-[0.2em] text-ink/45 uppercase">
        Chapter {act}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
