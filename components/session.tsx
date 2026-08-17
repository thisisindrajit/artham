"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  currentScene,
  initState,
  shouldConsultPartner,
  step,
  type Action,
  type EngineEvent,
  type PlayState,
} from "@/lib/engine";
import { digest } from "@/lib/partner/types";
import type {
  ObserveResponse,
  PreludeResponse,
  ThinkingProfile,
} from "@/lib/partner/types";
import type { Scenario, ThinkingObservation } from "@/lib/story";
import { PartnerCard } from "./partner-card";
import { PaperBackdrop } from "./paper-backdrop";
import { ArthamMark } from "./artham-mark";
import {
  buttonPrimary,
  cardInteractive,
  cardSoft,
  storyOption,
  storyTag,
} from "@/lib/ui";
import { ProfileView } from "./profile-view";
import { StoryRecap } from "./story-recap";
import { StoryStage } from "./story-stage";
import {
  ChoiceView,
  ConsequenceView,
  EndingView,
  Narration,
  NarrativeView,
  ReflectView,
  ReorderView,
  SliderView,
} from "./scenes";

export function Session({ scenario }: { scenario: Scenario }) {
  const [state, setState] = useState<PlayState>(() => initState(scenario.id));
  const [prelude, setPrelude] = useState<PreludeResponse | null>(null);
  const [partner, setPartner] = useState<ObserveResponse | null>(null);
  const [thinking, setThinking] = useState(false);
  const [profile, setProfile] = useState<ThinkingProfile | null>(null);
  const [stagePreview, setStagePreview] = useState<string | null>(null);

  const callsUsed = useRef(0);
  const stateRef = useRef(state);

  /* Every mutation goes through here so the ref the async partner reads is
     never behind the rendered state. Written from handlers only, never during
     render. */
  const commit = useCallback((next: PlayState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const recordObservation = useCallback(
    (observation: ThinkingObservation) => {
      const prev = stateRef.current;
      commit({
        ...prev,
        notes: {
          ...prev.notes,
          observations: [...prev.notes.observations, observation],
        },
      });
    },
    [commit],
  );

  /* The one pre-session call. Fired during the intro so it is warm by the
     time the learner clicks through. */
  useEffect(() => {
    let live = true;
    fetch("/api/partner/prelude", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenarioId: scenario.id }),
    })
      .then((r) => r.json())
      .then((data: PreludeResponse) => {
        if (live && data?.question?.options?.length) setPrelude(data);
      })
      .catch(() => {
        /* the fallback below covers it */
      });
    return () => {
      live = false;
    };
  }, [scenario.id]);

  const consult = useCallback(
    async (event: EngineEvent) => {
      if (!shouldConsultPartner(event, callsUsed.current)) return;
      callsUsed.current += 1;
      setThinking(true);
      try {
        const res = await fetch("/api/partner/observe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            scenarioId: scenario.id,
            event,
            notes: digest(stateRef.current.notes),
          }),
        });
        const data = (await res.json()) as ObserveResponse;
        if (!data?.action) return;

        // Never chain a question onto an answer — that turns the partner into
        // an interrogation instead of a companion.
        const action =
          event.kind === "reasoning" && data.action === "ask"
            ? "observe"
            : data.action;

        setPartner({ ...data, action });
        if (data.observation) recordObservation(data.observation);
      } catch {
        setPartner(null);
      } finally {
        setThinking(false);
      }
    },
    [scenario.id, recordObservation],
  );

  const run = useCallback(
    (action: Action) => {
      const result = step(stateRef.current, action);
      setStagePreview(null);
      commit(result.state);
      if (action.type !== "reasoning") setPartner(null);
      if (result.event) void consult(result.event);
    },
    [commit, consult],
  );

  /* The one end-of-session call. */
  useEffect(() => {
    if (state.phase !== "profile" || profile) return;
    let live = true;
    const scene = currentScene(state);
    fetch("/api/partner/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioId: scenario.id,
        notes: digest(state.notes),
        outcome: scene.type === "ending" ? scene.outcome : "partial",
      }),
    })
      .then((r) => r.json())
      .then((data: ThinkingProfile) => {
        if (live && data?.archetype) setProfile(data);
      })
      .catch(() => {
        /* ProfileView renders its own retry */
      });
    return () => {
      live = false;
    };
  }, [state, profile, scenario.id]);

  if (state.phase === "profile") {
    return (
      <ProfileView scenario={scenario} profile={profile} notes={state.notes} />
    );
  }

  const scene = currentScene(state);
  const mood = state.pending && !state.pending.correct ? "alarm" : scene.mood;

  return (
    <div
      data-domain={scenario.domain}
      data-mood={state.phase === "scene" ? mood : "night"}
      className="relative isolate flex min-h-dvh flex-col"
    >
      <PaperBackdrop />
      <Rail scenario={scenario} state={state} />

      <main className="relative mx-auto grid w-full max-w-[1600px] flex-1 items-start gap-8 px-6 py-10 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.2fr)] xl:grid-cols-[minmax(280px,0.85fr)_minmax(440px,1.25fr)_minmax(240px,0.65fr)] xl:gap-6 2xl:gap-10">
        <div className="order-1 lg:sticky lg:top-20 lg:col-start-1 lg:row-start-1 lg:self-start">
          <StoryStage
            key={`${state.phase}-${scene.id}-${state.pending?.correct ?? "open"}`}
            visual={
              state.phase === "intro" || state.phase === "presession"
                ? scenario.intro.visual
                : scene.visual
            }
            mood={mood}
            label={scenario.stageLabel}
            preview={stagePreview}
            result={
              state.pending
                ? state.pending.correct
                  ? "success"
                  : "warning"
                : null
            }
          />
        </div>

        <section
          className="story-sheet relative isolate order-3 mx-auto flex w-full max-w-2xl flex-col justify-center rounded-3xl border-[1.5px] border-ink/12 bg-white/95 p-6 shadow-[0_6px_0_rgba(23,23,23,0.08),0_28px_70px_rgba(23,23,23,0.11)] sm:p-8 lg:order-none lg:col-start-2 lg:row-start-1 lg:p-10"
        >
          {state.phase === "intro" && (
            <Intro scenario={scenario} onBegin={() => run({ type: "begin" })} />
          )}

          {state.phase === "presession" && (
            <PreSession
              scenario={scenario}
              prelude={prelude}
              onAnswer={(question, answer, approach) =>
                run({ type: "presession", question, answer, approach })
              }
              onPreview={setStagePreview}
            />
          )}

          {state.phase === "scene" && state.pending && (
            <ConsequenceView
              text={state.pending.text}
              correct={state.pending.correct}
              onAdvance={() => run({ type: "advance" })}
            />
          )}

          {state.phase === "scene" && !state.pending && (
            <>
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
        </section>

        <StoryRecap
          scenario={scenario}
          state={state}
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

/* -------------------- sections -------------------- */

function Intro({
  scenario,
  onBegin,
}: {
  scenario: Scenario;
  onBegin: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="rise space-y-2">
        <p
          className={`${storyTag} inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic tracking-[0.16em] uppercase`}
        >
          {scenario.minutes}-minute story · {scenario.difficulty}
        </p>
        <h1 className="text-[30px] font-light tracking-tight text-ink sm:text-[32px]">
          {scenario.title}
        </h1>
        <p className="text-[15.5px] text-muted">
          You are the {scenario.intro.role}.
        </p>
      </div>
      <Narration text={scenario.intro.text} />
      <button
        onClick={onBegin}
        data-press="deep"
        className={`${buttonPrimary} rise inline-flex items-center gap-3 rounded-full px-6 py-3 text-[16px] font-bold italic`}
        style={{
          animationDelay: `${scenario.intro.text.length * 110 + 160}ms`,
        }}
      >
        {scenario.intro.cta}
        <span aria-hidden className="not-italic">→</span>
      </button>
    </div>
  );
}

function PreSession({
  scenario,
  prelude,
  onAnswer,
  onPreview,
}: {
  scenario: Scenario;
  prelude: PreludeResponse | null;
  onAnswer: (
    question: string,
    answer: string,
    approach?: Scenario["preSession"]["options"][number]["approach"],
  ) => void;
  onPreview: (message: string | null) => void;
}) {
  const question = prelude?.question ?? scenario.preSession;
  const greeting = prelude?.greeting ?? scenario.partnerGreeting;

  return (
    <div className="space-y-8">
      <div className="rise flex items-start gap-4">
        <ArthamMark size={36} />
        <div>
          <p className="mb-2 text-[13px] font-medium tracking-[0.18em] text-muted uppercase">
            Artham
          </p>
          <p className="text-[17px] leading-relaxed text-ink/90">
            {greeting}
          </p>
        </div>
      </div>

      <div className="rise space-y-3" style={{ animationDelay: "180ms" }}>
        <p className="text-[17px] leading-relaxed text-ink/90">
          {question.prompt}
        </p>
        <div className="grid gap-2.5">
          {question.options.map((option, i) => (
            <button
              key={option.id}
              onClick={() =>
                onAnswer(question.prompt, option.label, option.approach)
              }
              onMouseEnter={() =>
                onPreview(`I would start by: ${option.label}`)
              }
              onMouseLeave={() => onPreview(null)}
              onFocus={() => onPreview(`I would start by: ${option.label}`)}
              onBlur={() => onPreview(null)}
              data-press="deep"
              className={`${cardSoft} ${cardInteractive} ${storyOption} rise rounded-2xl px-5 py-4 text-left text-[16px] font-semibold text-ink`}
              style={{ animationDelay: `${260 + i * 70}ms` }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Rail({ scenario, state }: { scenario: Scenario; state: PlayState }) {
  const scene = currentScene(state);
  const index = scenario.scenes.findIndex((s) => s.id === scene.id);
  const progress =
    state.phase === "scene" ? ((index + 1) / scenario.scenes.length) * 100 : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/80 shadow-[0_4px_18px_rgba(111,56,17,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-[13px] tracking-[0.22em] text-faint uppercase transition hover:text-muted"
        >
          <ArthamMark
            size={32}
            className="w-[28px] transition-transform duration-300 ease-[var(--ease-bounce)] group-hover:-rotate-12 group-hover:scale-110"
          />
        </Link>
        {state.phase === "scene" && (
          <span className="text-[13px] tracking-[0.16em] text-faint uppercase">
            Chapter {scene.act} · {scene.beat}
          </span>
        )}
      </div>
      <div className="h-1 w-full bg-accent/12">
        <div
          className="h-1 rounded-r-full bg-accent transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
