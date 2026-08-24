"use client";

import { currentScene } from "@/lib/engine";
import type { CSSProperties } from "react";
import type { Scenario } from "@/lib/story";
import { useElementHeight } from "@/hooks/use-element-height";
import { useStorySession } from "@/hooks/use-story-session";
import { PartnerCard } from "./partner-card";
import { PaperBackdrop } from "./paper-backdrop";
import { ProfileView } from "./profile-view";
import { StoryContextColumn, StoryContextSheet } from "./session/story-context";
import { StoryFlow } from "./session/story-flow";
import { BackgroundAudio } from "./background-audio";
import type { AuthUser } from "./auth/user-avatar";
import { AppHeader } from "./app-header";

/**
 * A story session: one long story column, one context column.
 *
 * The third column — a fixed diagram of the current scene — is gone. It could
 * not follow a scrolling story, and a picture of the beat belongs *in* the
 * beat, which is where `StoryImage` now puts it.
 */
export function Session({ scenario, user }: { scenario: Scenario; user: AuthUser }) {
  const { state, prelude, partner, thinking, profile, run, setPartner } =
    useStorySession(scenario);
  const [barRef, barHeight] = useElementHeight<HTMLDivElement>();

  if (state.phase === "profile") {
    return (
      <ProfileView
        scenario={scenario}
        profile={profile}
        notes={state.notes}
        learnerId={user.id || user.email || "local-learner"}
      />
    );
  }

  const scene = currentScene(state, scenario);
  const sceneIndex = scenario.scenes.findIndex(
    (candidate) => candidate.id === scene.id,
  );
  const progress =
    state.phase === "scene"
      ? ((sceneIndex + 1) / scenario.scenes.length) * 100
      : 0;
  const mood =
    state.phase !== "scene"
      ? "night"
      : state.pending && !state.pending.correct
        ? "alarm"
        : scene.mood;

  return (
    <div
      data-domain={scenario.domain}
      data-mood={mood}
      style={{ "--session-bar": `${barHeight}px` } as CSSProperties}
      className="relative isolate flex min-h-dvh flex-col"
    >
      <PaperBackdrop />
      {scenario.backgroundAudio && (
        <BackgroundAudio
          src={scenario.backgroundAudio.src}
          loop={scenario.backgroundAudio.loop}
        />
      )}
      <AppHeader
        user={user}
        compact
        progress={{
          label:
            state.phase === "scene"
              ? `Chapter ${scene.act} · ${scene.beat}`
              : scenario.title,
          value: progress,
        }}
      />

      <main className="relative mx-auto grid w-full max-w-[1180px] flex-1 items-start gap-8 px-5 pt-10 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:gap-9">
        <div
          className="mx-auto w-full max-w-2xl min-w-0 pb-[var(--session-bar)] lg:max-w-none"
        >
          <StoryFlow
            scenario={scenario}
            state={state}
            prelude={prelude}
            busy={thinking}
            barHeight={barHeight}
            run={run}
          />
        </div>

        <StoryContextColumn scenario={scenario} state={state} />
      </main>

      {/* The bar floats over the story, so the story column reserves exactly
          its height — otherwise the partner card lands on top of the button
          the learner is being asked to press. */}
      <div ref={barRef} className="pointer-events-none sticky bottom-0 z-10 pb-5">
        <div className="mx-auto grid w-full max-w-[1180px] gap-3 px-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:gap-9">
          {/* Stretched, not `items-start`: the partner card is a panel and
              should match the story column. Only the sheet trigger is a pill,
              so it opts out with `self-start`. */}
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 lg:max-w-none">
            <StoryContextSheet scenario={scenario} state={state} />
            <PartnerCard
              message={partner}
              thinking={thinking}
              onAnswer={(question, answer) =>
                run({ type: "reasoning", question, answer })
              }
              onDismiss={() => setPartner(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
