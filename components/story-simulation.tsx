"use client";

import { useMemo, useState } from "react";
import type {
  DeclarativeSimulation,
  SceneSimGuide,
  StorySimulation,
} from "@/lib/story";
import { SimFrame, SimGuideProvider, SimSlider } from "./sim-kit";
import {
  evaluateSimulationReadout,
} from "@/utils/simulation-runtime";

/**
 * A hands-on model plus the scene's own instructions for reading it.
 *
 * The guide travels by context so `SimFrame` can render it *inside* the model's
 * frame — see `sim-kit.tsx`.
 */
export function StorySimulation({
  kind,
  guide,
}: {
  kind: StorySimulation;
  guide?: SceneSimGuide;
}) {
  return (
    <SimGuideProvider guide={guide}>
      <DeclarativeSimulationView simulation={kind} />
    </SimGuideProvider>
  );
}
function DeclarativeSimulationView({
  simulation,
}: {
  simulation: DeclarativeSimulation;
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      simulation.controls.map((control) => [control.id, control.initial]),
    ),
  );
  const readouts = useMemo(
    () =>
      simulation.readouts.map((readout) => ({
        ...readout,
        value: evaluateSimulationReadout(readout, values),
      })),
    [simulation.readouts, values],
  );
  return (
    <SimFrame
      eyebrow={simulation.title}
      hint={simulation.prompt}
      footer={simulation.explanation}
      badge={
        simulation.readouts.length > 0
          ? { text: "Explore the relationship", tone: "accent" }
          : undefined
      }
    >
      <div className="space-y-5">
        {simulation.controls.map((control) => (
          <div key={control.id} className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-muted">
                  {control.label}
                </p>
                <p className="mt-0.5 text-[12px] leading-[1.4] text-faint">
                  {control.description}
                </p>
              </div>
              <span className="font-mono text-[17px] font-bold text-ink">
                {values[control.id]} {control.unit}
              </span>
            </div>
            <SimSlider
              label={control.label}
              min={control.min}
              max={control.max}
              step={control.step}
              value={values[control.id]}
              onChange={(value) =>
                setValues((current) => ({ ...current, [control.id]: value }))
              }
              left={`${control.min}${control.unit}`}
              right={`${control.max}${control.unit}`}
            />
          </div>
        ))}
        {readouts.length > 0 ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            {readouts.map((readout) => (
              <div
                key={readout.id}
                className="rounded-xl border border-accent/15 bg-accent/[0.07] px-4 py-3"
              >
                <dt className="text-[12px] font-bold tracking-wide text-muted uppercase">
                  {readout.label}
                </dt>
                <dd className="mt-1 font-mono text-[22px] font-bold text-ink">
                  {readout.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rounded-xl bg-rose/[0.07] px-4 py-3 text-[14px] leading-relaxed text-ink/75">
            This legacy model has no live readout configured.
          </p>
        )}
      </div>
    </SimFrame>
  );
}
