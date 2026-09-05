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
import { fallbackObserve } from "@/lib/partner/fallbacks";

export function useStorySession(scenario: Scenario) {
  const [state, setState] = useState<PlayState>(() =>
    initState(scenario.id, scenario),
  );
  const [prelude, setPrelude] = useState<PreludeResponse | null>(null);
  const [partner, setPartner] = useState<ObserveResponse | null>(null);
  const [thinking, setThinking] = useState(false);
  const [profile, setProfile] = useState<ThinkingProfile | null>(null);
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

  const recordClue = useCallback(
    (sceneId: string, clue: string) => {
      const value = clue.trim();
      if (!value) return;
      const previous = stateRef.current;
      const existing = previous.clues[sceneId] ?? [];
      if (existing.includes(value)) return;
      commit({
        ...previous,
        clues: {
          ...previous.clues,
          [sceneId]: [...existing, value],
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
        if (live && data?.question?.prompt) setPrelude(data);
      })
      .catch(() => {
        // The deterministic scenario prelude remains available as a fallback.
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
        if (action === "guide") recordClue(event.sceneId, data.message);
        if (data.observation) recordObservation(data.observation);
      } catch {
        const fallback = fallbackObserve(
          event,
          "hint" in event ? event.hint : "Recheck what changed in the scene.",
        );
        setPartner(fallback);
        if (fallback.action === "guide") {
          recordClue(event.sceneId, fallback.message);
        }
      } finally {
        setThinking(false);
      }
    },
    [scenario.id, recordClue, recordObservation],
  );

  const run = useCallback(
    (action: Action) => {
      const result = step(stateRef.current, action, scenario);
      commit(result.state);
      if (action.type !== "reasoning") setPartner(null);
      if (result.event) void consult(result.event);
    },
    [commit, consult, scenario],
  );

  useEffect(() => {
    if (state.phase !== "profile" || profile || thinking) return;
    let live = true;
    const scene = currentScene(state, scenario);
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
        // ProfileView keeps its deterministic profile visible when needed.
      });
    return () => {
      live = false;
    };
  }, [state, profile, scenario, thinking]);

  return {
    state,
    prelude,
    partner,
    thinking,
    profile,
    run,
    setPartner,
  };
}
