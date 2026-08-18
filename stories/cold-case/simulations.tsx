"use client";

import { useState } from "react";
import { SimBar, SimFrame, SimSlider, SimToggle } from "@/components/sim-kit";
import {
  BIOLOGY_CITY_POPULATION,
  CONTAMINATION_STEPS,
} from "./constants";
import { matchingPool } from "./utils";

/* ------------------------------------------------------------------ */
/* marker-match — how many markers turn a crowd into a person           */
/* ------------------------------------------------------------------ */

export function MarkerMatch() {
  const [markers, setMarkers] = useState(6);
  const people = matchingPool(markers);
  const alone = people < 1;
  // Draw the crowd, but never more dots than a person can take in.
  const dots = Math.min(Math.round(people), 60);

  return (
    <SimFrame
      eyebrow="how many markers"
      hint="Every marker you add cuts the crowd to a quarter of its size."
      badge={
        alone
          ? { text: "one person alive", tone: "sage" }
          : { text: `${Math.round(people).toLocaleString()} people match`, tone: "rose" }
      }
      footer={
        alone ? (
          <>
            At <strong>{markers} markers</strong> the profile stops describing a
            group and starts describing a human being. Nobody else in the city
            carries this combination.
          </>
        ) : (
          <>
            A {markers}-marker profile fits{" "}
            <strong>{Math.round(people).toLocaleString()} people</strong> in this
            city alone. Finding one of them in a database is not surprising — it
            is counting. The match tells you he is <em>in the group</em>, not
            that he did it.
          </>
        )
      }
    >
      <div
        className="flex min-h-24 flex-wrap content-start gap-1.5 rounded-xl bg-accent/6 p-4"
        role="img"
        aria-label={`${Math.round(people)} people in a city of 300,000 share a ${markers} marker profile.`}
      >
        {alone ? (
          <span className="flex items-center gap-2.5">
            <span className="size-4 rounded-full bg-accent" />
            <span className="text-[15px] font-semibold text-ink">
              one person
            </span>
          </span>
        ) : (
          <>
            {Array.from({ length: dots }).map((_, i) => (
              <span key={i} className="size-4 rounded-full bg-rose/70" />
            ))}
            {people > 60 && (
              <span className="self-center pl-1 text-[14px] font-semibold text-rose">
                + {(Math.round(people) - 60).toLocaleString()} more
              </span>
            )}
          </>
        )}
      </div>

      <div className="mt-5">
        <SimSlider
          label="Markers in the profile"
          min={4}
          max={14}
          step={1}
          value={markers}
          onChange={setMarkers}
          left="4 markers"
          right="14 markers"
          middle={
            <span className="font-mono tabular-nums font-medium text-ink">
              {markers} markers
            </span>
          }
        />
      </div>
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* contamination-path — where the stray DNA got in                      */
/* ------------------------------------------------------------------ */

export function ContaminationPath() {
  const [clean, setClean] = useState(false);
  // On a shared bench the stray profile boards the sample at the cut and
  // rides it the rest of the way.
  const enters = clean ? -1 : 3;

  return (
    <SimFrame
      eyebrow="chain of custody"
      hint="Follow one glove through the lab. Watch who is on it."
      badge={
        clean
          ? { text: "two people, start to finish", tone: "sage" }
          : { text: "a third profile appears", tone: "rose" }
      }
      footer={
        clean ? (
          <>
            A fresh blade, a wiped bench and a new pair of gloves for every
            exhibit. Whatever comes off the plate was on the glove.
          </>
        ) : (
          <>
            The same blade cut a reference sample an hour earlier. From the cut
            onwards the glove carries a profile that was never at the scene —
            and the machine cannot tell you <em>when</em> that profile arrived.
          </>
        )
      }
    >
      <div className="mb-4 flex rounded-full bg-accent/8 p-1">
        <SimToggle active={!clean} onClick={() => setClean(false)}>
          Shared blade
        </SimToggle>
        <SimToggle active={clean} onClick={() => setClean(true)}>
          Fresh blade
        </SimToggle>
      </div>

      <ol className="space-y-2">
        {CONTAMINATION_STEPS.map((step, i) => {
          const dirty = enters >= 0 && i >= enters;
          return (
            <li
              key={step.id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                dirty
                  ? "border-rose/35 bg-rose/8"
                  : "border-line bg-white"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`font-mono tabular-nums grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                    dirty ? "bg-rose text-white" : "bg-ink/8 text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="truncate text-[14.5px] text-ink">
                  {step.label}
                </span>
              </span>
              <span
                className={`shrink-0 text-[13px] font-semibold ${
                  dirty ? "text-rose" : "text-muted"
                }`}
              >
                {dirty ? "+ an analyst" : step.who}
              </span>
            </li>
          );
        })}
      </ol>
    </SimFrame>
  );
}

/* ------------------------------------------------------------------ */
/* suspect-funnel — the same number read two different ways             */
/* ------------------------------------------------------------------ */

export function SuspectFunnel() {
  // Opens on a single suspect so the learner discovers the flip themselves;
  // starting wide would hand them the answer before they touch anything.
  const [searched, setSearched] = useState(1);
  const matchChance = 1 / 4_096;
  const innocentHits = searched * matchChance;
  const misleading = innocentHits >= 1;

  return (
    <SimFrame
      eyebrow="who else did you ask"
      hint="One profile, about one chance in 4,000. Now choose how many people you compare it against."
      badge={
        misleading
          ? { text: `${innocentHits.toFixed(0)} innocent hits expected`, tone: "rose" }
          : { text: "a hit would be surprising", tone: "sage" }
      }
      footer={
        misleading ? (
          <>
            Search {searched.toLocaleString()} people and you should expect about{" "}
            <strong>{innocentHits.toFixed(0)}</strong> of them to match by pure
            chance. Finding a match proves the database is big. It does not
            single anybody out.
          </>
        ) : (
          <>
            Test one suspect you already had reason to suspect, and a match is
            genuinely unlikely to be a coincidence. Same test, same odds — but
            now the match is evidence, because you were not fishing.
          </>
        )
      }
    >
      <div className="space-y-3.5">
        <SimBar
          label="People compared against the profile"
          value={Math.min(searched, BIOLOGY_CITY_POPULATION)}
          max={BIOLOGY_CITY_POPULATION}
          tone="ink"
          caption={searched.toLocaleString()}
        />
        <SimBar
          label="Innocent people expected to match"
          value={Math.min(innocentHits, 80)}
          max={80}
          tone={misleading ? "rose" : "sage"}
          caption={
            innocentHits >= 1 ? innocentHits.toFixed(1) : innocentHits.toFixed(2)
          }
        />
      </div>

      <div className="mt-5">
        <SimSlider
          label="People compared against the profile"
          min={1}
          max={300_000}
          step={1_000}
          value={searched}
          onChange={setSearched}
          left="1 suspect"
          right="300,000 in the database"
        />
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-ink/80">
        The odds on the certificate never change. What changes is{" "}
        <strong className="italic">how many doors you knocked on</strong> before
        one opened.
      </p>
    </SimFrame>
  );
}
