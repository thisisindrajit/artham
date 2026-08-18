"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  currentScene,
  initState,
  shouldConsultPartner,
  step,
  type Action,
  type EngineEvent,
  type PlayState,
} from "@/lib/engine";
import type {
  ObserveResponse,
  PreludeResponse,
  ThinkingProfile,
} from "@/types/partner";
import type { Scenario, ThinkingObservation } from "@/types/story";
import { digestNotes } from "@/utils/session-notes";

export function useStorySession(scenario: Scenario) {
  const [state, setState] = useState<PlayState>(() => initState(scenario.id));
  const [prelude, setPrelude] = useState<PreludeResponse | null>(null);
  const [partner, setPartner] = useState<ObserveResponse | null>(null);
  const [thinking, setThinking] = useState(false);
  const [profile, setProfile] = useState<ThinkingProfile | null>(null);
  const [stagePreview, setStagePreview] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const callsUsed = useRef(0);
  const stateRef = useRef(state);

  const commit = useCallback((next: PlayState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const recordObservation = useCallback(
    (observation: ThinkingObservation) => {
      const previous = stateRef.current;
      commit({
        ...previous,
        notes: {
          ...previous.notes,
          observations: [...previous.notes.observations, observation],
        },
      });
    },
    [commit],
  );

  useEffect(() => {
    let live = true;
    fetch("/api/partner/prelude", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenarioId: scenario.id }),
    })
      .then((response) => response.json())
      .then((data: PreludeResponse) => {
        if (live && data?.question?.options?.length) setPrelude(data);
      })
      .catch(() => {
        // The deterministic scenario prelude remains available offline.
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
        const response = await fetch("/api/partner/observe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            scenarioId: scenario.id,
            event,
            notes: digestNotes(stateRef.current.notes),
          }),
        });
        const data = (await response.json()) as ObserveResponse;
        if (!data?.action) return;

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
      setReviewing(null);
      commit(result.state);
      if (action.type !== "reasoning") setPartner(null);
      if (result.event) void consult(result.event);
    },
    [commit, consult],
  );

  useEffect(() => {
    if (state.phase !== "profile" || profile) return;
    let live = true;
    const scene = currentScene(state);
    fetch("/api/partner/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioId: scenario.id,
        notes: digestNotes(state.notes),
        outcome: scene.type === "ending" ? scene.outcome : "partial",
      }),
    })
      .then((response) => response.json())
      .then((data: ThinkingProfile) => {
        if (live && data?.archetype) setProfile(data);
      })
      .catch(() => {
        // ProfileView keeps its retry state visible when the partner is offline.
      });
    return () => {
      live = false;
    };
  }, [state, profile, scenario.id]);

  return {
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
  };
}
