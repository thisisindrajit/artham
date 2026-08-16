"use client";

import { useState } from "react";
import { SimBar, SimFrame, SimSlider } from "./sim-kit";

/**
 * One straight-line market shared by all three toys, so the learner sees the
 * same city react to three different levers.
 *
 *   families looking:  Qd = 120 - 2r
 *   homes offered:     Qs =  20 + 2r
 *   (r = rent in hundreds of dollars a month, Q = thousands of homes)
 *
 * Left alone it settles at $2,500 with 70,000 homes rented.
 */
const looking = (rent: number) => 120 - 2 * rent;
const offered = (rent: number) => 20 + 2 * rent;
const MARKET_RENT = 25;
const SCALE = 100;

const k = (n: number) => `${Math.round(n)},000`;
/** Model rent (hundreds of dollars) as the dollars-a-month figure on screen. */
const money = (rent: number) => `$${Math.round(rent * 100).toLocaleString()}`;

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
          ? { text: `${k(shortage)} families left out`, tone: "rose" }
          : { text: "everyone who wants one gets one", tone: "sage" }
      }
      footer={
        shortage > 0 ? (
          <>
            The {k(rented)} families who get a home pay less — that part is
            real. But the cap did not build anything. Some owners stop renting
            out, and {k(shortage)} families are now queuing for a home that does
            not exist.
          </>
        ) : (
          <>
            The cap is set above what people are already paying, so nothing
            changes. A rule only bites when it asks for something the market was
            not going to do anyway.
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
          caption={k(wanting)}
        />
        <SimBar
          label="Homes actually put up for rent"
          value={rented}
          max={SCALE}
          tone={shortage > 0 ? "rose" : "sage"}
          caption={k(rented)}
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
              cap {money(cap)}
            </span>
          }
        />
      </div>
      <p className="mt-2 text-[13px] text-muted">
        Without any cap, rent settles at {money(MARKET_RENT)}.
      </p>
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* supply-shift — more homes lowers rent without a rule                 */
/* ------------------------------------------------------------------ */

export function SupplyShift() {
  const [built, setBuilt] = useState(0);
  // 120 - 2r = 20 + 2r + built  ->  r = (100 - built) / 4
  const rent = (100 - built) / 4;
  const rented = offered(rent) + built;
  const capRented = offered(rent); // the same rent, reached by decree instead

  return (
    <SimFrame
      eyebrow="build instead"
      hint="Unblock land and permits. Nobody is told what to charge."
      badge={{
        text: `rent ${money(rent)}`,
        tone: rent <= 18 ? "sage" : rent <= 22 ? "accent" : "rose",
      }}
      footer={
        <>
          Same rent as a cap would have forced — but{" "}
          <strong>{k(rented - capRented)} more families housed</strong>, because
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
            {money(rent)}
            <span className="ml-1 text-[17px] text-muted">/ month</span>
          </p>
        </div>
        <div className="pb-1.5">
          <p className="text-[12.5px] tracking-[0.14em] text-faint uppercase">
            Homes rented
          </p>
          <p className="font-mono tabular-nums text-[22px] leading-tight font-light text-sage">
            {k(rented)}
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
            {k(built)} unblocked
          </span>
        }
      />
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* budget-split — where $400 million actually lands                     */
/* ------------------------------------------------------------------ */

const BUDGET_HOMES = 40;

export function BudgetSplit() {
  const [toVouchers, setToVouchers] = useState(50);
  const helped = (BUDGET_HOMES * toVouchers) / 100;
  const built = BUDGET_HOMES - helped;
  // Vouchers push demand up; new homes push supply up.
  const rent = (100 + helped - built) / 4;
  const worse = rent > MARKET_RENT;

  return (
    <SimFrame
      eyebrow="$400 million, one budget"
      hint="Cash straight to renters, or money to get homes built?"
      badge={{
        text: `rent ${money(rent)}`,
        tone: worse ? "rose" : rent <= 18 ? "sage" : "accent",
      }}
      footer={
        worse ? (
          <>
            The {k(helped)} families holding a voucher can suddenly pay more —
            so they do, and they bid against everyone else for the same
            unchanged pile of homes. Rent for the whole city rises to{" "}
            {money(rent)}. Helping renters pay is not the same as helping
            renters.
          </>
        ) : (
          <>
            Money spent on getting homes built lowers rent for everyone,
            including the families who never fill in a form. Vouchers are faster
            and they land on the people who need them today — that is a real
            argument for them, as long as somebody is also building.
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
            {k(helped)}
          </p>
        </div>
        <div>
          <p className="text-[12.5px] tracking-[0.14em] text-faint uppercase">
            Homes added
          </p>
          <p className="font-mono tabular-nums text-[26px] leading-tight font-light text-sage">
            {k(built)}
          </p>
        </div>
      </div>

      <SimBar
        label="Rent everyone in the city pays"
        value={rent}
        max={40}
        tone={worse ? "rose" : "sage"}
        caption={money(rent)}
      />

      <div className="mt-5">
        <SimSlider
          label="Share of the budget spent on vouchers"
          min={0}
          max={100}
          step={10}
          value={toVouchers}
          onChange={setToVouchers}
          left="all to building"
          right="all to vouchers"
          middle={
            <span className="font-mono tabular-nums font-medium text-ink">
              {toVouchers}% vouchers
            </span>
          }
        />
      </div>
    </SimFrame>
  );
}
