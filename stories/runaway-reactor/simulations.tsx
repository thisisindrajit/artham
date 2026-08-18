"use client";

import { useState } from "react";
import { SimBar, SimFrame, SimSlider, SimToggle } from "@/components/sim-kit";
import { linePath } from "@/utils/svg";
import {
  SIM_CHART_HEIGHT as H,
  SIM_CHART_WIDTH as W,
} from "@/constants/simulations";
import {
  CHEMISTRY_COOLING_DELAY_MINUTES as COOLING_TAKES,
  CHEMISTRY_MAX_TEMPERATURE as T_MAX,
  CHEMISTRY_MIN_TEMPERATURE as T_MIN,
  CHEMISTRY_REACTION_LIMIT as LIMIT,
} from "./constants";
import {
  jacketCooling as heatTaken,
  reactionHeat as heatMade,
} from "./utils";

/* ------------------------------------------------------------------ */
/* heat-race — the reaction's heat grows faster than the jacket's       */
/* ------------------------------------------------------------------ */

export function HeatRace() {
  const [power, setPower] = useState(30);

  let crossing: number | null = null;
  for (
    let t = T_MIN;
    t <= T_MAX;
    t += 0.5
  ) {
    if (heatMade(t) >= heatTaken(t, power)) {
      crossing = Math.round(t);
      break;
    }
  }

  const yMax = 620;
  const samples = Array.from({ length: 61 }, (_, i) => T_MIN + (i * (T_MAX - T_MIN)) / 60);
  const made = linePath(
    samples.map((t) => ({ x: t, y: Math.min(heatMade(t), yMax) })),
    [T_MIN, T_MAX],
    [0, yMax],
    W,
    H,
  );
  const taken = linePath(
    samples.map((t) => ({ x: t, y: Math.min(heatTaken(t, power), yMax) })),
    [T_MIN, T_MAX],
    [0, yMax],
    W,
    H,
  );
  const crossX =
    crossing === null ? null : ((crossing - T_MIN) / (T_MAX - T_MIN)) * W;

  return (
    <SimFrame
      eyebrow="heat race"
      hint="Turn the cooling up and down. Watch where the two lines meet."
      badge={
        crossing === null
          ? { text: "cooling stays ahead", tone: "sage" }
          : { text: `runs away past ${crossing}°C`, tone: "rose" }
      }
      footer={
        crossing === null ? (
          <>
            At this cooling power the jacket removes more heat than the reaction
            makes, at every temperature on the dial. The batch settles down on
            its own.
          </>
        ) : (
          <>
            Below <strong>{crossing}°C</strong> the jacket wins and the batch
            calms down. Above it, the reaction makes heat faster than the jacket
            can take it away — and getting hotter makes it worse. There is no
            coming back from the wrong side of that line.
          </>
        )
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-32 w-full"
        role="img"
        aria-label={`Heat made rises steeply with temperature; heat removed rises in a straight line. ${
          crossing === null
            ? "They do not cross."
            : `They cross at ${crossing} degrees.`
        }`}
      >
        <rect width={W} height={H} fill="var(--color-accent)" opacity="0.05" />
        {crossX !== null && (
          <>
            <rect
              x={crossX}
              width={W - crossX}
              height={H}
              fill="var(--color-rose)"
              opacity="0.1"
            />
            <line
              x1={crossX}
              x2={crossX}
              y1={0}
              y2={H}
              stroke="var(--color-rose)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </>
        )}
        <path
          d={taken}
          fill="none"
          stroke="var(--color-sage)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d={made}
          fill="none"
          stroke="var(--color-rose)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-1 mb-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
        <span className="font-medium text-rose">— heat the reaction makes</span>
        <span className="font-medium text-sage">— heat the cooling removes</span>
      </div>

      <SimSlider
        label="Cooling power"
        min={0}
        max={100}
        step={5}
        value={power}
        onChange={setPower}
        left="jacket off"
        right="full blast"
        middle={
          <span className="font-mono tabular-nums font-medium text-ink">{power}% cooling</span>
        }
      />
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* feed-slow — you control the heat by controlling the feed             */
/* ------------------------------------------------------------------ */

export function FeedSlow() {
  const [mode, setMode] = useState<"dump" | "drip">("dump");
  const dump = mode === "dump";

  const curve = (t: number) =>
    dump ? 74 + 120 * (1 - Math.exp(-t / 9)) : 74 + 30 * (1 - Math.exp(-t / 14));

  const yMax = 200;
  const samples = Array.from({ length: 61 }, (_, i) => i);
  const path = linePath(
    samples.map((t) => ({ x: t, y: curve(t) })),
    [0, 60],
    [40, yMax],
    W,
    H,
  );
  const limitY = H - ((LIMIT - 40) / (yMax - 40)) * H;
  const peak = Math.round(curve(60));

  return (
    <SimFrame
      eyebrow="feed rate"
      hint="Same drum of reactant. Two ways to add it."
      badge={
        dump
          ? { text: "relief valve blows", tone: "rose" }
          : { text: "stays in control", tone: "sage" }
      }
      footer={
        dump ? (
          <>
            All of it goes in at once, so all of it reacts at once. The batch is
            past <strong>{LIMIT}°C</strong> in about ten minutes and the jacket
            never catches up.
          </>
        ) : (
          <>
            The reactant is added as fast as it gets used up, so there is never a
            pile of unreacted stuff waiting to go off. The heat arrives slowly
            enough for the jacket to carry it away.
          </>
        )
      }
    >
      <div className="mb-4 flex rounded-full bg-accent/8 p-1">
        <SimToggle active={dump} onClick={() => setMode("dump")}>
          Pour it all in
        </SimToggle>
        <SimToggle active={!dump} onClick={() => setMode("drip")}>
          Feed it slowly
        </SimToggle>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-32 w-full"
        role="img"
        aria-label={`Batch temperature over one hour, peaking at ${peak} degrees.`}
      >
        <rect width={W} height={H} fill="var(--color-accent)" opacity="0.05" />
        <rect
          y={0}
          width={W}
          height={limitY}
          fill="var(--color-rose)"
          opacity="0.1"
        />
        <line
          x1={0}
          x2={W}
          y1={limitY}
          y2={limitY}
          stroke="var(--color-rose)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <path
          d={path}
          fill="none"
          stroke={dump ? "var(--color-rose)" : "var(--color-sage)"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-1 flex justify-between text-[13px] text-muted">
        <span>0 min</span>
        <span className="font-medium text-rose">valve lifts at {LIMIT}°C</span>
        <span>60 min</span>
      </div>
      <p className="mt-3 text-[15px] text-ink/80">
        Highest temperature reached:{" "}
        <span
          className={`font-mono tabular-nums font-semibold ${dump ? "text-rose" : "text-sage"}`}
        >
          {peak}°C
        </span>
      </p>
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* runaway-clock — the window closes faster than you think              */
/* ------------------------------------------------------------------ */

export function RunawayClock() {
  const [temp, setTemp] = useState(96);
  // Anchored to the story: about 24 minutes at 101°C, and the time you have
  // halves for every 10°C on top of that.
  const minutesLeft = 24 * Math.pow(2, -(temp - 101) / 10);
  const tooLate = minutesLeft < COOLING_TAKES;
  const scale = 70;

  return (
    <SimFrame
      eyebrow="how long have you got"
      hint="Drag the batch temperature. The clock is not linear."
      badge={
        tooLate
          ? { text: "cooling is too slow now", tone: "rose" }
          : { text: "cooling can still catch it", tone: "sage" }
      }
      footer={
        tooLate ? (
          <>
            The jacket needs {COOLING_TAKES} minutes to bite, and you have{" "}
            {minutesLeft.toFixed(0)}. Cooling is no longer a plan — it is a wish.
          </>
        ) : (
          <>
            Every 10°C hotter halves the time you have. At 101°C you have about
            24 minutes; by 121°C the same batch gives you six. The decision has
            to be made while everything still looks fine.
          </>
        )
      }
    >
      <div className="space-y-3.5">
        <SimBar
          label="Time before it runs away"
          value={Math.min(minutesLeft, scale)}
          max={scale}
          tone={tooLate ? "rose" : "sage"}
          caption={`${minutesLeft.toFixed(0)} min`}
        />
        <SimBar
          label="Time the cooling needs"
          value={COOLING_TAKES}
          max={scale}
          tone="ink"
          caption={`${COOLING_TAKES} min`}
        />
      </div>

      <div className="mt-5">
        <SimSlider
          label="Batch temperature"
          min={90}
          max={150}
          step={1}
          value={temp}
          onChange={setTemp}
          left="90°C"
          right="150°C"
          middle={
            <span className="font-mono tabular-nums font-medium text-ink">{temp}°C now</span>
          }
        />
      </div>
    </SimFrame>
  );
}
