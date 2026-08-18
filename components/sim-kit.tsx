"use client";

import type { CSSProperties, ReactNode } from "react";
import { cardSoft, rangeInput } from "@/constants/ui";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusPill } from "@/components/ui/status-pill";
import type { UiTone } from "@/types/components";

/**
 * Shared chrome for the hands-on models. Every simulation is a small toy the
 * learner can poke before they are asked to decide — never a graded step.
 */
export function SimFrame({
  eyebrow,
  hint,
  badge,
  children,
  footer,
}: {
  eyebrow: string;
  hint: string;
  badge?: { text: string; tone: "rose" | "sage" | "accent" };
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className={`${cardSoft} animate-rise overflow-hidden rounded-2xl motion-reduce:animate-none`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="text-[12px] font-bold italic tracking-[0.16em] text-ink uppercase">
            Try it · {eyebrow}
          </p>
          <p className="mt-1 text-[15px] text-muted">{hint}</p>
        </div>
        {badge && (
          <StatusPill tone={badge.tone}>{badge.text}</StatusPill>
        )}
      </div>

      <div className="px-5 py-5">{children}</div>

      {footer && (
        <div className="border-t border-line px-5 py-4 text-[15px] leading-relaxed text-ink/80">
          {footer}
        </div>
      )}
    </section>
  );
}

export function SimToggle({
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

export function SimSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  left,
  right,
  middle,
  track,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  left: string;
  right: string;
  middle?: ReactNode;
  track?: string;
}) {
  return (
    <div>
      <input
        type="range"
        aria-label={label}
        className={rangeInput}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={track ? ({ "--track": track } as CSSProperties) : undefined}
      />
      <div className="flex justify-between gap-2 text-[12px] text-muted">
        <span>{left}</span>
        {middle}
        <span>{right}</span>
      </div>
    </div>
  );
}

/** A labelled horizontal bar. Used wherever two quantities need comparing. */
export function SimBar({
  label,
  value,
  max,
  tone,
  caption,
}: {
  label: string;
  value: number;
  max: number;
  tone: UiTone;
  caption: string;
}) {
  const fill = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] text-muted">{label}</span>
        <span className="font-mono tabular-nums text-[15px] font-medium text-ink">
          {caption}
        </span>
      </div>
      <ProgressBar value={fill} tone={tone} className="h-3.5" />
    </div>
  );
}
