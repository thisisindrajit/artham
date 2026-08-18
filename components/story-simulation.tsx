"use client";

import type { SceneSimGuide, StorySimulationKind } from "@/lib/story";
import { ContaminationPath, MarkerMatch, SuspectFunnel } from "@/stories/cold-case/simulations";
import { BudgetSplit, PriceCap, SupplyShift } from "@/stories/rent-crisis/simulations";
import { StormBand, TimedPushes } from "@/stories/resonance-bridge/simulations";
import { FeedSlow, HeatRace, RunawayClock } from "@/stories/runaway-reactor/simulations";
import { HorseHollow, SiegeClock, StoryCheck } from "@/stories/trojan-horse/simulations";

/** Exhaustive on purpose: a new kind must fail the build, not silently
 * render somebody else's lab. */
export function StorySimulation({
  kind,
  guide,
}: {
  kind: StorySimulationKind;
  guide?: SceneSimGuide;
}) {
  return (
    <div className="space-y-3">
      {guide && <SimGuide guide={guide} />}
      <SimBody kind={kind} />
    </div>
  );
}

/**
 * The label on the model.
 *
 * Three fixed questions in a fixed order, because a learner meeting a new toy
 * asks them in that order: what am I looking at, what do I touch, what should I
 * notice. Keeping the questions constant across every simulation means the
 * learner only has to learn the shape once.
 */
function SimGuide({ guide }: { guide: SceneSimGuide }) {
  const rows: Array<{ emoji: string; label: string; body: string }> = [
    { emoji: "👀", label: "What this shows", body: guide.shows },
    { emoji: "👆", label: "What to move", body: guide.move },
    { emoji: "💡", label: "What changes", body: guide.watch },
  ];

  return (
    <section className="animate-rise rounded-2xl border border-accent/25 bg-accent/6 px-5 py-4 motion-reduce:animate-none">
      <p className="text-[12px] font-bold tracking-[0.16em] text-ink/55 uppercase">
        How to read this
      </p>
      <dl className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-[15px] leading-none">
              {row.emoji}
            </span>
            <div className="min-w-0">
              <dt className="text-[13px] font-bold text-ink">{row.label}</dt>
              <dd className="text-[15px] leading-[1.6] text-ink/80">
                {row.body}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SimBody({ kind }: { kind: StorySimulationKind }) {
  switch (kind) {
    case "timed-pushes":
      return <TimedPushes />;
    case "storm-band":
      return <StormBand />;
    case "heat-race":
      return <HeatRace />;
    case "feed-slow":
      return <FeedSlow />;
    case "runaway-clock":
      return <RunawayClock />;
    case "price-cap":
      return <PriceCap />;
    case "supply-shift":
      return <SupplyShift />;
    case "budget-split":
      return <BudgetSplit />;
    case "marker-match":
      return <MarkerMatch />;
    case "contamination-path":
      return <ContaminationPath />;
    case "suspect-funnel":
      return <SuspectFunnel />;
    case "siege-clock":
      return <SiegeClock />;
    case "story-check":
      return <StoryCheck />;
    case "horse-hollow":
      return <HorseHollow />;
  }
}
