"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { cardSoft, rangeInput } from "@/constants/ui";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusPill } from "@/components/ui/status-pill";
import type { UiTone } from "@/types/components";
import type { SceneSimGuide } from "@/types/story";

/**
 * The scene's plain-language label for whatever model is rendered below.
 *
 * Passed by context rather than by prop because it belongs to the *scene*, not
 * to the simulation: the same model means something different in a different
 * beat. Context keeps all fourteen simulation components free of a prop they
 * would only ever forward.
 */
const SimGuideContext = createContext<SceneSimGuide | null>(null);

export function SimGuideProvider({
  guide,
  children,
}: {
  guide?: SceneSimGuide;
  children: ReactNode;
}) {
  return (
    <SimGuideContext.Provider value={guide ?? null}>
      {children}
    </SimGuideContext.Provider>
  );
}

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
  const guide = useContext(SimGuideContext);

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

      {guide && <SimGuide guide={guide} />}

      <div className="px-5 py-5">{children}</div>

      {footer && (
        <div className="border-t border-line px-5 py-4 text-[15px] leading-relaxed text-ink/80">
          {footer}
        </div>
      )}
    </section>
  );
}

/**
 * The instructions for the model, inside the model's own frame.
 *
 * They used to sit in a separate card above it, which read as a paragraph the
 * learner had already left behind by the time they reached the slider. Inside
 * the frame the three lines stay in view while the control is being moved,
 * which is the only moment they are worth anything.
 *
 * Three fixed questions in a fixed order, because a learner meeting a new toy
 * asks them in that order: what am I looking at, what do I touch, what should I
 * notice. Keeping the questions constant across every simulation means the
 * shape only has to be learned once.
 */
export function SimGuide({ guide }: { guide: SceneSimGuide }) {
  const rows = [
    { emoji: "👀", label: "What this shows", body: guide.shows },
    { emoji: "👆", label: "What to move", body: guide.move },
    { emoji: "💡", label: "What changes", body: guide.watch },
  ];

  return (
    <div className="border-b border-line bg-accent/[0.06] px-5 py-4">
      <p className="text-[11.5px] font-bold tracking-[0.16em] text-ink/55 uppercase">
        How to read this
      </p>
      <dl className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-[15px] leading-none">
              {row.emoji}
            </span>
            <div className="min-w-0">
              <dt className="text-[13px] font-bold text-ink">{row.label}</dt>
              <dd className="text-[15px] leading-[1.6] text-ink/80">
                {row.body}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
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
