"use client";

import { useState } from "react";
import { linePath, SimBar, SimFrame, SimSlider, SimToggle } from "./sim-kit";

const W = 300;
const H = 120;

/* ------------------------------------------------------------------ */
/* story-check — one man's word against ground that cannot lie          */
/* ------------------------------------------------------------------ */

const CLAIMS = [
  {
    id: "left",
    claim: "“The whole fleet has sailed for home.”",
    ground: "Fire pits still warm. Ships beached this morning, not last week.",
    agrees: false,
  },
  {
    id: "offering",
    claim: "“The horse is a gift for the goddess. Untouched.”",
    ground: "Fresh tar at the seams. Somebody sealed it two days ago.",
    agrees: false,
  },
  {
    id: "hated",
    claim: "“They left me behind. They wanted me dead.”",
    ground: "His wrists are tied with a slip knot. It came loose at a tug.",
    agrees: false,
  },
  {
    id: "big",
    claim: "“It was built too big for your gates, so you could not take it in.”",
    ground: "True. It is too big for the gates. Anyone can see that.",
    agrees: true,
  },
];

export function StoryCheck() {
  const [checking, setChecking] = useState(false);
  const survives = CLAIMS.filter((c) => c.agrees).length;

  return (
    <SimFrame
      eyebrow="test the story"
      hint="Sinon has told you four things. Hold each one against the ground."
      badge={
        checking
          ? { text: `${survives} of 4 survive`, tone: "rose" }
          : { text: "all of it hangs together", tone: "accent" }
      }
      footer={
        checking ? (
          <>
            Only the claim you could already see for yourself survives. A story
            that explains everything and is backed by nothing is not evidence —
            it is a <strong className="italic">story</strong>. The ground has no
            reason to lie to you; Sinon has every reason.
          </>
        ) : (
          <>
            Taken on its own the account is complete, moving, and answers every
            question you had. That is exactly what a prepared story is supposed
            to do. Turn it over.
          </>
        )
      }
    >
      <div className="mb-4 flex rounded-full bg-accent/8 p-1">
        <SimToggle active={!checking} onClick={() => setChecking(false)}>
          Just listen
        </SimToggle>
        <SimToggle active={checking} onClick={() => setChecking(true)}>
          Check the ground
        </SimToggle>
      </div>

      <ul className="space-y-2.5">
        {CLAIMS.map((c) => (
          <li
            key={c.id}
            className={`rounded-xl border px-4 py-3 transition ${
              checking
                ? c.agrees
                  ? "border-sage/35 bg-sage/8"
                  : "border-rose/35 bg-rose/8"
                : "border-line bg-white"
            }`}
          >
            <p className="text-[15px] font-medium text-ink italic">{c.claim}</p>
            {checking && (
              <p
                className={`mt-1.5 text-[14px] leading-relaxed ${
                  c.agrees ? "text-sage" : "text-rose"
                }`}
              >
                {c.agrees ? "holds — " : "does not hold — "}
                <span className="text-ink/75">{c.ground}</span>
              </p>
            )}
          </li>
        ))}
      </ul>
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* horse-hollow — weigh it without opening it                           */
/* ------------------------------------------------------------------ */

/** Oak, roughly. A solid horse of this size would be brutally heavy. */
const SOLID_TONNES = 14;
/** What the ruts in the sand actually say it weighs. */
const RUT_TONNES = 6;

export function HorseHollow() {
  const [fill, setFill] = useState(100);
  const weight = (SOLID_TONNES * fill) / 100;
  const matchesRuts = Math.abs(weight - RUT_TONNES) < 0.9;

  return (
    <SimFrame
      eyebrow="weigh it from outside"
      hint="You cannot open it. But the ruts it left in the sand are a scale."
      badge={
        matchesRuts
          ? { text: "matches the ruts", tone: "rose" }
          : { text: "too heavy for those ruts", tone: "accent" }
      }
      footer={
        matchesRuts ? (
          <>
            At <strong>{fill}% solid</strong> the weight finally agrees with the
            tracks. An empty shell would weigh about three tonnes. This one
            weighs six — so{" "}
            <strong className="italic">three tonnes of it is not wood</strong>.
            That is about forty men with their weapons.
          </>
        ) : (
          <>
            A solid horse this size weighs about {SOLID_TONNES} tonnes and would
            have cut ruts a forearm deep. The ruts on the plain are ankle deep.
            Slide the fill down until the weight matches what the sand recorded.
          </>
        )
      }
    >
      <div className="space-y-3.5">
        <SimBar
          label="Weight at this fill"
          value={weight}
          max={SOLID_TONNES}
          tone={matchesRuts ? "rose" : "accent"}
          caption={`${weight.toFixed(1)} t`}
        />
        <SimBar
          label="Weight the ruts imply"
          value={RUT_TONNES}
          max={SOLID_TONNES}
          tone="ink"
          caption={`${RUT_TONNES} t`}
        />
      </div>

      <div className="mt-5">
        <SimSlider
          label="How much of the horse is solid timber"
          min={10}
          max={100}
          step={5}
          value={fill}
          onChange={setFill}
          left="hollow shell"
          right="solid oak"
          middle={
            <span className="font-mono tabular-nums font-medium text-ink">{fill}% solid</span>
          }
        />
      </div>
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* siege-clock — the sums that make the trap worth trying               */
/* ------------------------------------------------------------------ */

const STORE_TONNES = 2_000;
const MOUTHS = 9_000;

export function SiegeClock() {
  const [ration, setRation] = useState(6);
  // Tonnes eaten per day across the whole city, at this ration in kg a head.
  const perDay = (MOUTHS * ration) / 1000;
  const days = STORE_TONNES / perDay;
  const winter = 40;
  const holds = days >= winter;
  const weak = ration <= 3;

  const samples = Array.from({ length: 61 }, (_, i) => i);
  const path = linePath(
    samples.map((d) => ({
      x: d,
      y: Math.max(0, STORE_TONNES - perDay * d),
    })),
    [0, 60],
    [0, STORE_TONNES],
    W,
    H,
  );
  const winterX = (winter / 60) * W;

  return (
    <SimFrame
      eyebrow="how long can troy wait"
      hint="The sea closes in forty days. If you outlast that, the Greeks must go home."
      badge={
        !holds
          ? { text: "starves before the storms", tone: "rose" }
          : weak
            ? { text: "holds, but cannot fight", tone: "rose" }
            : { text: "outlasts them", tone: "sage" }
      }
      footer={
        !holds ? (
          <>
            The stores run dry on <strong>day {days.toFixed(0)}</strong>, with{" "}
            {(winter - days).toFixed(0)} days of sailing weather still to go. The
            city opens its own gates.
          </>
        ) : weak ? (
          <>
            The grain lasts, but on this ration a man cannot carry armour up to
            the wall. Troy survives the sums and loses the wall.
          </>
        ) : (
          <>
            Waiting wins. Ten years of it says so. Which is exactly why the trap
            has to arrive as a{" "}
            <strong className="italic">gift you invite through the gate</strong>
            {" "}— nothing else gets past the wall in time.
          </>
        )
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-32 w-full"
        role="img"
        aria-label={`Grain stores run out on day ${days.toFixed(0)}. The storms come on day ${winter}.`}
      >
        <rect width={W} height={H} fill="var(--color-accent)" opacity="0.05" />
        <rect
          x={winterX}
          width={W - winterX}
          height={H}
          fill="var(--color-sage)"
          opacity="0.12"
        />
        <line
          x1={winterX}
          x2={winterX}
          y1={0}
          y2={H}
          stroke="var(--color-sage)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <path
          d={path}
          fill="none"
          stroke={holds && !weak ? "var(--color-sage)" : "var(--color-rose)"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-1 flex justify-between text-[13px] text-muted">
        <span>today</span>
        <span className="font-medium text-sage">storms close the sea</span>
        <span>day 60</span>
      </div>

      <div className="mt-4">
        <SimSlider
          label="Daily grain ration"
          min={2}
          max={10}
          step={1}
          value={ration}
          onChange={setRation}
          left="starvation"
          right="full bread"
          middle={
            <span className="font-mono tabular-nums font-medium text-ink">
              stores last {days.toFixed(0)} days
            </span>
          }
        />
      </div>
    </SimFrame>
  );
}
