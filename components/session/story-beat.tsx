"use client";

import { useMemo } from "react";
import type { StoryBeatProps } from "@/types/components";
import { StoryImage } from "@/components/story-image";
import { buildGlossary } from "@/components/scenes/term-tooltip";
import {
  ChoiceControls,
  EndingControls,
  NarrativeControls,
  OutcomeCard,
  PrimaryButton,
  ReflectControls,
  ReorderControls,
  SceneBody,
  SceneHeading,
  SliderControls,
} from "@/components/scenes";
import { beatAttempts } from "@/utils/story-trail";

/**
 * One beat of the story, as a block on the continuous page.
 *
 * A beat renders identically whether the learner is standing on it or scrolled
 * past it — picture, heading, prose, fact, micro-lesson, model, then every
 * attempt they made and what it changed. Only the tail differs: the live beat
 * ends in controls, a finished one simply ends.
 *
 * The attempt log is derived from `state.notes` rather than remembered
 * separately, so what a learner reads when scrolling back is by construction
 * the same record the Thinking Profile is written from.
 */
export function StoryBeat({
  scenario,
  state,
  scene,
  live,
  busy,
  run,
}: StoryBeatProps) {
  const attempts = beatAttempts(state, scene);
  const failedAttempts = attempts.filter((attempt) => attempt.tone === "warning");
  const completedAttempts = attempts.filter(
    (attempt) => attempt.tone !== "warning",
  );
  const pending = live ? state.pending : null;
  const canReveal =
    Boolean(pending && !pending.correct) && failedAttempts.length >= 2;
  const glossary = useMemo(
    () => buildGlossary(scenario.scenes),
    [scenario.scenes],
  );

  return (
    <article
      aria-current={live ? "step" : undefined}
      className="scroll-mt-28 space-y-8"
    >
      <StoryImage visual={scene.visual} />
      <SceneHeading scene={scene} />
      <SceneBody
        scene={scene}
        citations={scenario.citations}
        glossary={glossary}
      />

      {failedAttempts.map((attempt, i) => (
        <OutcomeCard
          key={`${scene.id}-try-${i}`}
          choice={attempt.choice}
          text={attempt.outcome}
          tone={attempt.tone}
        />
      ))}

      {(state.clues[scene.id] ?? []).map((clue, index) => (
        <aside
          key={`${scene.id}-clue-${index}`}
          className="rounded-2xl border border-accent/30 bg-accent/[0.07] px-5 py-4 shadow-[0_3px_0_rgb(var(--accent-rgb)/0.12)]"
        >
          <p className="text-[11px] font-bold tracking-[0.15em] text-accent uppercase">
            Artham clue {index + 1}
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink/85">{clue}</p>
        </aside>
      ))}

      {completedAttempts.map((attempt, i) => (
        <OutcomeCard
          key={`${scene.id}-complete-${i}`}
          choice={attempt.choice}
          text={attempt.outcome}
          tone={attempt.tone}
        />
      ))}

      {pending ? (
        <div className="flex flex-wrap items-center gap-4">
          <PrimaryButton
            onClick={() => run({ type: "advance" })}
            label={pending.correct ? "Continue" : "Try again"}
            disabled={busy}
          />
          {canReveal && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run({ type: "reveal" })}
              className="rounded-full border border-ink/15 bg-white px-5 py-3 text-[15px] font-bold text-ink shadow-[0_3px_0_rgba(23,23,23,0.08)] transition hover:-translate-y-0.5 hover:border-accent/45 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Show answer and continue
            </button>
          )}
        </div>
      ) : (
        live && <BeatControls scene={scene} scenario={scenario} state={state} busy={busy} run={run} />
      )}
    </article>
  );
}

function BeatControls({
  scenario,
  state,
  scene,
  busy,
  run,
}: Omit<StoryBeatProps, "live">) {
  switch (scene.type) {
    case "narrative":
      return <NarrativeControls onAdvance={() => run({ type: "advance" })} />;
    case "choice":
      return (
        <ChoiceControls
          scene={scene}
          tried={state.tried[scene.id] ?? []}
          busy={busy}
          onChoose={(optionId) => run({ type: "choose", optionId })}
          onHelp={() => run({ type: "help" })}
        />
      );
    case "slider":
      return (
        <SliderControls
          scene={scene}
          busy={busy}
          onCommit={(value) => run({ type: "commit", value })}
          onHelp={() => run({ type: "help" })}
        />
      );
    case "reorder":
      return (
        <ReorderControls
          scene={scene}
          busy={busy}
          initialOrder={state.reorderDrafts[scene.id]}
          onSubmit={(order) => run({ type: "reorder", order })}
          onHelp={() => run({ type: "help" })}
        />
      );
    case "reflect":
      return (
        <ReflectControls
          scene={scene}
          busy={busy}
          onSubmit={(answer) => run({ type: "reflect", answer })}
        />
      );
    case "ending":
      return (
        <EndingControls
          takeaway={scenario.takeaway}
          onFinish={() => run({ type: "advance" })}
        />
      );
  }
}
