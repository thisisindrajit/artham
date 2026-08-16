"use client";

import type { CSSProperties, ReactNode } from "react";
import { cardSoft } from "@/lib/ui";

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
  const badgeClass = badge
    ? {
        rose: "bg-rose/12 text-rose",
        sage: "bg-sage/12 text-sage",
        accent: "bg-accent/12 text-ink",
      }[badge.tone]
    : "";

  return (
    <section className={`${cardSoft} rise overflow-hidden rounded-2xl`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="text-[12px] font-bold italic tracking-[0.16em] text-ink uppercase">
            Try it · {eyebrow}
          </p>
          <p className="mt-1 text-[15px] text-muted">{hint}</p>
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${badgeClass}`}
          >
            {badge.text}
          </span>
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
        className="deck-slider"
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
  tone: "rose" | "sage" | "accent" | "ink";
  caption: string;
}) {
  const fill = Math.max(0, Math.min(100, (value / max) * 100));
  const color = {
    rose: "var(--color-rose)",
    sage: "var(--color-sage)",
    accent: "var(--color-accent)",
    ink: "color-mix(in srgb, var(--color-ink) 45%, transparent)",
  }[tone];
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] text-muted">{label}</span>
        <span className="font-mono tabular-nums text-[15px] font-medium text-ink">
          {caption}
        </span>
      </div>
      <div className="h-3.5 w-full overflow-hidden rounded-full bg-ink/8">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-300"
          style={{ width: `${fill}%`, background: color }}
        />
      </div>
    </div>
  );
}

/** Turns a series of points into an SVG polyline path inside a 0..w / 0..h box. */
export function linePath(
  points: { x: number; y: number }[],
  xRange: [number, number],
  yRange: [number, number],
  w: number,
  h: number,
): string {
  const [x0, x1] = xRange;
  const [y0, y1] = yRange;
  return points
    .map((p, i) => {
      const px = ((p.x - x0) / (x1 - x0)) * w;
      const py = h - ((p.y - y0) / (y1 - y0)) * h;
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${Math.max(0, Math.min(h, py)).toFixed(1)}`;
    })
    .join(" ");
}
