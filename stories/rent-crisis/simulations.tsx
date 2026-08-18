"use client";

import { useState } from "react";
import { SimBar, SimFrame, SimSlider } from "@/components/sim-kit";
import {
  formatMonthlyRent,
  formatThousands,
} from "@/utils/format";
import {
  ECONOMICS_BUDGET_HOMES as BUDGET_HOMES,
  ECONOMICS_MARKET_RENT as MARKET_RENT,
  ECONOMICS_SCALE as SCALE,
} from "./constants";
import {
  clearingRent,
  familiesLooking as looking,
  homesOffered as offered,
} from "./utils";

/**
 * One straight-line market shared by all three toys, so the learner sees the
 * same city react to three different levers.
 *
 *   families looking:  Qd = 111.4 - 0.86r
 *   homes offered:     Qs =  20.0 + 2.00r
 *   (r = rent in hundreds of dollars a month, Q = thousands of homes)
 *
 * At today's $2,500 rent, 90,000 families chase 70,000 homes. Left alone, the
 * line clears at $3,200. Adding 40,000 homes brings rent near $1,800.
 */
/* ------------------------------------------------------------------ */
/* price-cap — a cap moves the price, not the houses                    */
/* ------------------------------------------------------------------ */

export function PriceCap() {
  const [cap, setCap] = useState(15);
  const binding = cap < MARKET_RENT;
  const rented = binding ? offered(cap) : offered(MARKET_RENT);
  const wanting = binding ? looking(cap) : looking(MARKET_RENT);
  const shortage = Math.max(0, wanting - rented);

  return (
    <SimFrame
      eyebrow="the rent cap"
      hint="Set the highest rent anyone is allowed to charge."
      badge={
        shortage > 0
          ? { text: `${formatThousands(shortage)} families left out`, tone: "rose" }
          : { text: "everyone who wants one gets one", tone: "sage" }
      }
      footer={
        shortage > 0 ? (
          <>
            The {formatThousands(rented)} families who get a home pay less — that part is
            real. But the cap did not build anything. Some owners stop renting
            out, and {formatThousands(shortage)} families are now queuing for a home that does
            not exist.
          </>
        ) : (
          <>
            The cap is above the price where the bars meet, so nothing changes.
            A rule only bites when it asks for a lower price than the city would
            reach on its own.
          </>
        )
      }
    >
      <div className="space-y-3.5">
        <SimBar
          label="Families looking for a home"
          value={wanting}
          max={SCALE}
          tone="accent"
          caption={formatThousands(wanting)}
        />
        <SimBar
          label="Homes actually put up for rent"
          value={rented}
          max={SCALE}
          tone={shortage > 0 ? "rose" : "sage"}
          caption={formatThousands(rented)}
        />
      </div>

      <div className="mt-5">
        <SimSlider
          label="Rent cap in dollars a month"
          min={10}
          max={40}
          step={1}
          value={cap}
          onChange={setCap}
          left="$1,000"
          right="$4,000"
          middle={
            <span className="font-mono tabular-nums font-medium text-ink">
              cap {formatMonthlyRent(cap)}
            </span>
          }
        />
      </div>
      <p className="mt-2 text-[13px] text-muted">
        Today’s rent is $2,500, with 20,000 families left out. With no cap and
        no new homes, the line clears at {formatMonthlyRent(MARKET_RENT)}.
      </p>
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* supply-shift — more homes lowers rent without a rule                 */
/* ------------------------------------------------------------------ */

export function SupplyShift() {
  const [built, setBuilt] = useState(0);
  const rent = clearingRent(0, built);
  const rented = offered(rent) + built;
  const capRented = offered(rent); // the same rent, reached by a rule instead

  return (
    <SimFrame
      eyebrow="build instead"
      hint="Unblock land and permits. Nobody is told what to charge."
      badge={{
        text: `rent ${formatMonthlyRent(rent)}`,
        tone: rent <= 18 ? "sage" : rent <= 22 ? "accent" : "rose",
      }}
      footer={
        <>
          Same rent as a cap would have forced — but{" "}
          <strong>{formatThousands(rented - capRented)} more families housed</strong>, because
          the price fell for a reason instead of by order. It is slower and much
          less satisfying to announce.
        </>
      }
    >
      <div className="mb-5 flex items-end gap-6">
        <div>
          <p className="text-[12.5px] tracking-[0.14em] text-faint uppercase">
            Rent settles at
          </p>
          <p className="font-mono tabular-nums text-[34px] leading-tight font-light text-ink">
            {formatMonthlyRent(rent)}
            <span className="ml-1 text-[17px] text-muted">/ month</span>
          </p>
        </div>
        <div className="pb-1.5">
          <p className="text-[12.5px] tracking-[0.14em] text-faint uppercase">
            Homes rented
          </p>
          <p className="font-mono tabular-nums text-[22px] leading-tight font-light text-sage">
            {formatThousands(rented)}
          </p>
        </div>
      </div>

      <SimSlider
        label="New homes unblocked, in thousands"
        min={0}
        max={60}
        step={2}
        value={built}
        onChange={setBuilt}
        left="build nothing"
        right="60,000 homes"
        middle={
          <span className="font-mono tabular-nums font-medium text-ink">
            {formatThousands(built)} unblocked
          </span>
        }
      />
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* budget-split — where $400 million actually lands                     */
/* ------------------------------------------------------------------ */

export function BudgetSplit() {
  const [toCashHelp, setToCashHelp] = useState(50);
  const helped = (BUDGET_HOMES * toCashHelp) / 100;
  const built = BUDGET_HOMES - helped;
  // Cash help pushes demand up; new homes push supply up.
  const rent = clearingRent(helped, built);
  const worse = rent > MARKET_RENT + 0.001;

  return (
    <SimFrame
      eyebrow="$400 million, one budget"
      hint="Cash straight to renters, or money to get homes built?"
      badge={{
        text: `rent ${formatMonthlyRent(rent)}`,
        tone: worse ? "rose" : rent <= 18 ? "sage" : "accent",
      }}
      footer={
        worse ? (
          <>
            The {formatThousands(helped)} families getting cash help can suddenly pay more.
            So they do, and they bid against everyone else for the same homes.
            Rent for the whole city rises to {formatMonthlyRent(rent)}. Helping renters pay
            is not the same as adding homes.
          </>
        ) : (
          <>
            Money spent on getting homes built lowers rent for everyone,
            including families who never fill in a form. Cash help is faster and
            reaches people who need it today. It works best beside building.
          </>
        )
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[12.5px] tracking-[0.14em] text-faint uppercase">
            Families helped now
          </p>
          <p className="font-mono tabular-nums text-[26px] leading-tight font-bold text-ink">
            {formatThousands(helped)}
          </p>
        </div>
        <div>
          <p className="text-[12.5px] tracking-[0.14em] text-faint uppercase">
            Homes added
          </p>
          <p className="font-mono tabular-nums text-[26px] leading-tight font-light text-sage">
            {formatThousands(built)}
          </p>
        </div>
      </div>

      <SimBar
        label="Rent everyone in the city pays"
        value={rent}
        max={50}
        tone={worse ? "rose" : "sage"}
        caption={formatMonthlyRent(rent)}
      />

      <div className="mt-5">
        <SimSlider
          label="Share of the budget spent on cash help"
          min={0}
          max={100}
          step={10}
          value={toCashHelp}
          onChange={setToCashHelp}
          left="all to building"
          right="all to cash help"
          middle={
            <span className="font-mono tabular-nums font-medium text-ink">
              {toCashHelp}% cash help
            </span>
          }
        />
      </div>
    </SimFrame>
  );
}
