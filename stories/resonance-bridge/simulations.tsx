"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cardSoft, rangeInput } from "@/constants/ui";
import { DeckWave } from "./deck-wave";

export function TimedPushes() {
  const [timing, setTiming] = useState<"together" | "offbeat">("together");
  const together = timing === "together";

  return (
    <section
      className={`${cardSoft} animate-rise overflow-hidden rounded-2xl motion-reduce:animate-none`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-[12px] font-bold italic tracking-[0.16em] text-ink uppercase">
            Try it · push timing
          </p>
          <p className="mt-1 text-[15px] text-muted">
            Same push. Different timing.
          </p>
        </div>
        <div className="flex rounded-full bg-accent/8 p-1">
          <TimingButton active={together} onClick={() => setTiming("together")}>
            Push in time
          </TimingButton>
          <TimingButton active={!together} onClick={() => setTiming("offbeat")}>
            Push off-beat
          </TimingButton>
        </div>
      </div>

      <div className="relative h-28 bg-white">
        <DeckWave amplitude={together ? 0.92 : 0.16} className="size-full" />
        <div className="pointer-events-none absolute inset-x-5 bottom-2.5 flex justify-between text-[12px] text-muted">
          <span className="rounded-full bg-white/85 px-2 py-0.5">
            small push
          </span>
          <span
            className={`rounded-full bg-white/85 px-2 py-0.5 ${
              together ? "font-medium text-rose" : "text-sage"
            }`}
          >
            {together ? "movement grows" : "movement fades"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4">
        <p className="text-[15px] leading-relaxed text-ink/80">
          {together
            ? "Each push adds to the last one. That is resonance."
            : "The pushes miss the rhythm, so they stop adding up."}
        </p>
        <span
          className={`font-mono tabular-nums shrink-0 text-[17px] font-medium ${
            together ? "text-rose" : "text-sage"
          }`}
        >
          {together ? "40 → 310 mm" : "40 → 18 mm"}
        </span>
      </div>
    </section>
  );
}

function TimingButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
        active
          ? "bg-primary text-primary-ink shadow-[0_2px_0_var(--press)] active:shadow-none"
          : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function StormBand() {
  const [frequency, setFrequency] = useState(0.89);
  const inside = frequency >= 0.83 && frequency <= 0.95;
  const min = 0.75;
  const max = 1.3;
  const start = ((0.83 - min) / (max - min)) * 100;
  const end = ((0.95 - min) / (max - min)) * 100;

  return (
    <section
      className={`${cardSoft} animate-rise rounded-2xl px-5 py-5 motion-reduce:animate-none`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold italic tracking-[0.16em] text-ink uppercase">
            Try it · escape the storm
          </p>
          <p className="mt-1 text-[15px] text-muted">
            Move the deck&apos;s rhythm out of the red band.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
            inside ? "bg-rose/12 text-rose" : "bg-sage/12 text-sage"
          }`}
        >
          {inside ? "storm can feed it" : "clear of the storm"}
        </span>
      </div>

      <div className="mt-5">
        <input
          type="range"
          aria-label="Deck rhythm in pushes per second"
          className={rangeInput}
          min={min}
          max={max}
          step={0.01}
          value={frequency}
          onChange={(event) => setFrequency(Number(event.target.value))}
          style={
            {
              "--track": `linear-gradient(90deg, rgba(23,23,23,.16) 0%, rgba(23,23,23,.16) ${start}%, rgba(179,38,30,.55) ${start}%, rgba(179,38,30,.55) ${end}%, rgba(23,23,23,.16) ${end}%)`,
            } as CSSProperties
          }
        />
        <div className="flex justify-between text-[12px] text-muted">
          <span>0.75</span>
          <span className="font-medium text-rose">storm 0.83–0.95</span>
          <span>1.30</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[15px] text-ink/80">
          Deck rhythm:{" "}
          <span className="font-mono tabular-nums font-medium text-ink">
            {frequency.toFixed(2)}
          </span>{" "}
          times a second
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFrequency(0.89)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-muted transition hover:border-primary/35 hover:text-ink"
          >
            With weight
          </button>
          <button
            type="button"
            onClick={() => setFrequency(1.2)}
            className="rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-ink shadow-[0_2px_0_var(--press)] transition hover:bg-[#e04d07] active:shadow-none"
          >
            Weight off
          </button>
        </div>
      </div>
    </section>
  );
}
