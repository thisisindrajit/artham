"use client";

import { currentScene } from "@/lib/engine";
import type { Scenario, Scene } from "@/lib/story";
import { useStorySession } from "@/hooks/use-story-session";
import { PartnerCard } from "./partner-card";
import { PaperBackdrop } from "./paper-backdrop";
import { ProfileView } from "./profile-view";
import { StoryRecap } from "./story-recap";
import { StoryStage } from "./story-stage";
import {
  ChoiceView,
  ConsequenceView,
  EndingView,
  NarrativeView,
  ReflectView,
  ReorderView,
  ReviewView,
  SceneHeading,
  SliderView,
  StoryNav,
} from "./scenes";
import { SessionIntro } from "./session/session-intro";
import { SessionPrelude } from "./session/session-prelude";
import { SessionRail } from "./session/session-rail";

export function Session({ scenario }: { scenario: Scenario }) {
  const {
    state,
    prelude,
    partner,
    thinking,
    profile,
    stagePreview,
    reviewing,
    run,
    setPartner,
    setStagePreview,
    setReviewing,
  } = useStorySession(scenario);

  if (state.phase === "profile") {
    return (
      <ProfileView scenario={scenario} profile={profile} notes={state.notes} />
    );
  }

  const scene = currentScene(state);

  /* Beats the learner has actually reached, in order — the pages the Previous
     button is allowed to turn back to. Filtered against the scene list so a
     stale id can never index past the end. */
  const trail = state.visited.filter((id) =>
    scenario.scenes.some((s) => s.id === id),
  );
  const liveIndex = Math.max(0, trail.indexOf(state.sceneId));
  const reviewScene: Scene | null = reviewing
    ? (scenario.scenes.find((s) => s.id === reviewing) ?? null)
    : null;
  const pageIndex = reviewScene ? trail.indexOf(reviewScene.id) : liveIndex;
  const shownScene = reviewScene ?? scene;

  const turnBack = () => {
    const target = trail[pageIndex - 1];
    if (target) setReviewing(target);
  };
  const turnNext = () => {
    const nextIndex = pageIndex + 1;
    if (nextIndex > liveIndex) return;
    setReviewing(nextIndex === liveIndex ? null : trail[nextIndex]);
  };

  const mood = reviewScene
    ? reviewScene.mood
    : state.pending && !state.pending.correct
      ? "alarm"
      : scene.mood;

  return (
    <div
      data-domain={scenario.domain}
      data-mood={state.phase === "scene" ? mood : "night"}
      className="relative isolate flex min-h-dvh flex-col"
    >
      <PaperBackdrop />
      <SessionRail scenario={scenario} state={state} />

      <main className="relative mx-auto grid w-full max-w-[1600px] flex-1 items-start gap-8 px-6 py-10 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.2fr)] xl:grid-cols-[minmax(280px,0.85fr)_minmax(440px,1.25fr)_minmax(240px,0.65fr)] xl:gap-6 2xl:gap-10">
        <div className="order-1 lg:sticky lg:top-20 lg:col-start-1 lg:row-start-1 lg:self-start">
          <StoryStage
            key={`${state.phase}-${shownScene.id}-${reviewScene ? "back" : (state.pending?.correct ?? "open")}`}
            visual={
              state.phase === "intro" || state.phase === "presession"
                ? scenario.intro.visual
                : shownScene.visual
            }
            mood={mood}
            label={scenario.stageLabel}
            preview={stagePreview}
            result={
              reviewScene
                ? null
                : state.pending
                  ? state.pending.correct
                    ? "success"
                    : "warning"
                  : null
            }
          />
        </div>

        <section
          className="relative isolate order-3 mx-auto flex w-full max-w-2xl flex-col justify-center rounded-3xl border-[1.5px] border-ink/12 bg-white/95 p-6 shadow-[0_6px_0_rgba(23,23,23,0.08),0_28px_70px_rgba(23,23,23,0.11)] before:absolute before:-top-[9px] before:right-[13%] before:z-[1] before:h-[18px] before:w-[72px] before:rotate-[2.5deg] before:border before:border-[rgb(var(--accent-rgb)/0.22)] before:bg-[rgb(var(--accent-rgb)/0.2)] before:shadow-[0_2px_5px_rgba(23,23,23,0.08)] before:content-[''] sm:p-8 lg:order-none lg:col-start-2 lg:row-start-1 lg:p-10"
        >
          {state.phase === "intro" && (
            <SessionIntro
              scenario={scenario}
              onBegin={() => run({ type: "begin" })}
            />
          )}

          {state.phase === "presession" && (
            <SessionPrelude
              scenario={scenario}
              prelude={prelude}
              onAnswer={(question, answer, approach) =>
                run({ type: "presession", question, answer, approach })
              }
              onPreview={setStagePreview}
            />
          )}

          {state.phase === "scene" && reviewScene && (
            <ReviewView scene={reviewScene} notes={state.notes} />
          )}

          {state.phase === "scene" && !reviewScene && state.pending && (
            <ConsequenceView
              text={state.pending.text}
              correct={state.pending.correct}
              onAdvance={() => run({ type: "advance" })}
            />
          )}

          {state.phase === "scene" && !reviewScene && !state.pending && (
            <>
              <SceneHeading scene={scene} className="mb-5" />
              {scene.type === "narrative" && (
                <NarrativeView
                  scene={scene}
                  onAdvance={() => run({ type: "advance" })}
                />
              )}
              {scene.type === "choice" && (
                <ChoiceView
                  scene={scene}
                  tried={state.tried[scene.id] ?? []}
                  busy={thinking}
                  onChoose={(optionId) => run({ type: "choose", optionId })}
                  onHelp={() => run({ type: "help" })}
                  onPreview={setStagePreview}
                />
              )}
              {scene.type === "slider" && (
                <SliderView
                  scene={scene}
                  busy={thinking}
                  onCommit={(value) => run({ type: "commit", value })}
                  onHelp={() => run({ type: "help" })}
                  onPreview={setStagePreview}
                />
              )}
              {scene.type === "reorder" && (
                <ReorderView
                  scene={scene}
                  busy={thinking}
                  onSubmit={(order) => run({ type: "reorder", order })}
                  onHelp={() => run({ type: "help" })}
                  onPreview={setStagePreview}
                />
              )}
              {scene.type === "reflect" && (
                <ReflectView
                  scene={scene}
                  busy={thinking}
                  onSubmit={(answer) => run({ type: "reflect", answer })}
                />
              )}
              {scene.type === "ending" && (
                <EndingView
                  scene={scene}
                  takeaway={scenario.takeaway}
                  onFinish={() => run({ type: "advance" })}
                />
              )}
            </>
          )}

          {state.phase === "scene" && trail.length > 1 && (
            <StoryNav
              index={pageIndex}
              total={liveIndex + 1}
              reviewing={Boolean(reviewScene)}
              onBack={turnBack}
              onNext={turnNext}
            />
          )}
        </section>

        <StoryRecap
          scenario={scenario}
          state={state}
          activeId={reviewScene?.id ?? state.sceneId}
          onSelect={(id) => setReviewing(id === state.sceneId ? null : id)}
          className="order-2 lg:order-none lg:col-start-1 lg:row-start-2 lg:mt-0 xl:sticky xl:top-20 xl:col-start-3 xl:row-start-1 xl:max-h-[calc(100dvh-6rem)]"
        />
      </main>

      <div className="pointer-events-none sticky bottom-0 z-10 pb-6">
        <div className="mx-auto grid w-full max-w-[1600px] px-6 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.2fr)] xl:grid-cols-[minmax(280px,0.85fr)_minmax(440px,1.25fr)_minmax(240px,0.65fr)] xl:gap-6 2xl:gap-10">
          <div className="pointer-events-auto mx-auto w-full max-w-2xl lg:col-start-2">
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
