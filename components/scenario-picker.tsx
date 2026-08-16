"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Scenario } from "@/lib/story";
import { capMarker, card, cardInteractive, storyIndex } from "@/lib/ui";

const DIFFICULTY_PIPS: Record<Scenario["difficulty"], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * Mission-select for the landing page. It reuses the numbered chips and hover
 * treatment of the in-story choices on purpose: picking a situation should feel
 * like the first move of the game, not like a catalogue.
 */
export function ScenarioPicker({ scenarios }: { scenarios: Scenario[] }) {
  const router = useRouter();
  const [armed, setArmed] = useState<string | null>(null);

  useEffect(() => {
    for (const scenario of scenarios) {
      router.prefetch(`/play/${scenario.id}`);
    }
  }, [router, scenarios]);

  useEffect(() => {
    // Coming back (browser Back, or a bfcache restore) can leave a card stuck
    // showing "Starting…", because the component is restored rather than
    // remounted.
    function reset() {
      setArmed(null);
    }
    window.addEventListener("pageshow", reset);
    window.addEventListener("popstate", reset);
    return () => {
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("popstate", reset);
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      const index = Number(event.key) - 1;
      const scenario = scenarios[index];
      if (!Number.isInteger(index) || !scenario) return;
      event.preventDefault();
      setArmed(scenario.id);
      router.push(`/play/${scenario.id}`);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, scenarios]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {scenarios.map((scenario, i) => {
        const pips = DIFFICULTY_PIPS[scenario.difficulty];
        return (
          <Link
            key={scenario.id}
            href={`/play/${scenario.id}`}
            data-domain={scenario.domain}
            onClick={() => setArmed(scenario.id)}
            data-press="deep"
            className={`${card} ${cardInteractive} rise group block rounded-2xl px-5 py-5 active:scale-[0.995] sm:rounded-3xl sm:px-7 sm:py-6 ${
              armed === scenario.id ? "border-accent/45 bg-accent/8" : ""
            }`}
            style={{ animationDelay: `${260 + i * 80}ms` }}
          >
            <div className="flex items-start gap-3 sm:gap-3.5">
              <span className={`${storyIndex} mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[14px] font-extrabold italic transition-transform duration-300 ease-[var(--ease-bounce)] group-hover:-rotate-12 group-hover:scale-110 sm:size-9 sm:text-[15px]`}>
                {i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div>
                  <h2 className="text-[20px] leading-tight font-medium text-ink sm:text-[21px]">
                    {scenario.title}
                  </h2>
                  <span className="mt-2.5 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-none tracking-[0.13em] uppercase sm:mt-3 sm:text-[12px]">
                    <span className="inline-flex items-center gap-1.5 leading-none font-bold italic text-ink/75">
                      <span
                        aria-hidden
                        className={`${capMarker} size-1.5 shrink-0 rounded-full bg-accent`}
                      />
                      {scenario.domain}
                    </span>
                    <span className="leading-none text-muted">
                      · {scenario.minutes} min
                    </span>
                  </span>
                </div>

                <p className="mt-3.5 text-[15px] leading-relaxed text-ink/75 sm:text-[16px]">
                  {scenario.tagline}
                </p>

                {/* Baseline, not centre. "EASY" is all-caps so its ink sits high
                    inside its line box, while the role line runs down to a
                    descender — centring the boxes leaves the caps floating
                    ~1.9px proud. Sharing a writing line is what reads as
                    aligned.

                    The difficulty label is a plain inline span rather than a
                    flex container on purpose: an inline-flex exposes its *first
                    flex item's* baseline, which the pips can hijack. Inline text
                    has one unambiguous baseline for the row to align to. */}
                <div className="mt-4 flex flex-col items-start gap-2.5 sm:flex-row sm:items-baseline sm:gap-x-5">
                  <span className="shrink-0 text-[11px] tracking-[0.12em] whitespace-nowrap text-muted uppercase sm:text-[12px]">
                    {scenario.difficulty}
                    {/* Cap-band centring. Satoshi's caps measure 8.73px at
                        12px, so the pips want their centre 4.37px above the
                        baseline; `align-middle` alone lands 0.38px low because
                        it targets x-height, not cap-height. */}
                    <span
                      className="ml-2 inline-flex gap-1 align-middle -translate-y-[0.12em]"
                      aria-hidden
                    >
                      {[0, 1, 2].map((p) => (
                        <span
                          key={p}
                          className={`h-1 w-3.5 rounded-full sm:w-4 ${
                            p < pips ? "bg-accent" : "bg-ink/15"
                          }`}
                        />
                      ))}
                    </span>
                  </span>

                  <span className="text-[13px] leading-snug text-muted sm:text-[14px]">
                    You play the{" "}
                    <span className="text-ink">{scenario.intro.role}</span>
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-primary px-4 py-2.5 text-[14px] font-bold italic text-primary-ink shadow-[0_4px_0_var(--press),0_10px_22px_rgba(23,23,23,0.22)] transition duration-200 ease-[var(--ease-bounce)] group-hover:-translate-y-0.5 group-active:shadow-[0_1px_0_var(--press),0_4px_10px_rgba(23,23,23,0.18)] sm:px-5">
                    {armed === scenario.id ? "Starting…" : "Start"}
                    <span
                      aria-hidden
                      className="not-italic transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                  <span className="hidden text-[13px] text-muted sm:inline">
                    or press{" "}
                    <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[12px] text-muted">
                      {i + 1}
                    </kbd>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}

      {/* Deliberately NOT the `sticker` recipe: that tilts by -1.8deg, which is charming
          on a small pill but swings the ends of a 768px block by ~12px and
          reads as broken next to three straight cards. Border width, padding
          and chip size match the cards exactly so the left rail is unbroken. */}
      <div
        className="rise flex items-center gap-3 rounded-2xl border border-dashed border-ink/25 bg-white/55 px-5 py-5 sm:gap-3.5 sm:rounded-3xl sm:px-7"
        style={{ animationDelay: `${260 + scenarios.length * 80}ms` }}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-ink/30 text-[14px] font-semibold text-ink/60 sm:size-9 sm:text-[15px]">
          ?
        </span>
        <p className="text-[14px] text-ink/70 sm:text-[15px]">
          More situations are being written. Biology, history, and one about a
          crowded lift.
        </p>
      </div>
    </div>
  );
}
