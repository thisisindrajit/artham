"use client";

import { capMarker } from "@/constants/ui";
import type {
  ScenarioFilterBarProps,
  ScenarioFilterChipProps,
} from "@/types/components";

export function ScenarioFilterBar({
  domains,
  active,
  onChange,
  total,
  countOf,
}: ScenarioFilterBarProps) {
  return (
    <div
      role="group"
      aria-label="Filter stories by subject"
      className="flex flex-wrap items-center gap-2"
    >
      <ScenarioFilterChip
        label="All"
        count={total}
        active={active === "all"}
        onClick={() => onChange("all")}
      />
      {domains.map((domain) => (
        <ScenarioFilterChip
          key={domain}
          domain={domain}
          label={domain}
          count={countOf(domain)}
          active={active === domain}
          onClick={() => onChange(domain)}
        />
      ))}
    </div>
  );
}

function ScenarioFilterChip({
  domain,
  label,
  count,
  active,
  onClick,
}: ScenarioFilterChipProps) {
  return (
    <button
      type="button"
      data-domain={domain}
      data-press="deep"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] leading-none font-semibold tracking-[0.1em] uppercase transition duration-200 ease-out sm:text-[12.5px] ${
        active
          ? "border-accent/50 bg-accent/14 text-ink shadow-[0_3px_0_rgb(var(--accent-rgb)/0.24)]"
          : "border-line bg-white/70 text-muted hover:-translate-y-0.5 hover:border-accent/40 hover:text-ink"
      }`}
    >
      <span
        aria-hidden
        className={`${capMarker} size-1.5 shrink-0 rounded-full ${
          active ? "bg-accent" : "bg-ink/25"
        }`}
      />
      {label}
      <span className={active ? "text-ink/55" : "text-ink/35"}>{count}</span>
    </button>
  );
}
