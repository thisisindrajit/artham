import Link from "next/link";
import { DIFFICULTY_PIPS, DOMAIN_LABELS } from "@/constants/story";
import {
  capMarker,
  card,
  cardInteractive,
  sticker,
} from "@/constants/ui";
import type { ScenarioCardProps } from "@/types/components";
import { ScenarioCover } from "@/components/scenario-cover";

export function ScenarioCard({
  scenario,
  index,
  armed,
  showShortcutHint = true,
  onArm,
  onIntent,
}: ScenarioCardProps) {
  const pips = DIFFICULTY_PIPS[scenario.difficulty];

  return (
    <Link
      href={scenario.playPath ?? `/play/${scenario.id}`}
      prefetch={false}
      data-domain={scenario.domain}
      onClick={onArm}
      onMouseEnter={onIntent}
      onFocus={onIntent}
      onTouchStart={onIntent}
      data-press="deep"
      className={`${card} ${cardInteractive} animate-rise group flex flex-col gap-4 rounded-3xl p-4 motion-reduce:animate-none active:scale-[0.995] sm:p-5 ${
        armed ? "border-accent/45 bg-accent/8" : ""
      }`}
      style={{ animationDelay: `${260 + index * 70}ms` }}
    >
      {scenario.art.src && (
        <div className="relative">
          <ScenarioCover scenario={scenario} />

          <span
            className={`${sticker} absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/90 px-2.5 py-1.5 text-[11px] leading-none font-bold tracking-[0.12em] text-ink uppercase shadow-[0_2px_0_rgba(23,23,23,0.08)] backdrop-blur-sm`}
          >
            <span
              aria-hidden
              className={`${capMarker} size-1.5 shrink-0 rounded-full bg-accent`}
            />
            {DOMAIN_LABELS[scenario.domain]}
          </span>

          <span className="absolute right-3 bottom-3 rounded-full border border-ink/10 bg-white/90 px-2.5 py-1.5 text-[11px] leading-none font-medium text-muted backdrop-blur-sm">
            {scenario.minutes} min
          </span>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="text-[19px] leading-tight font-medium text-ink sm:text-[20px]">
          {scenario.title}
        </h2>

        <p className="mt-1.5 text-[14px] leading-snug font-medium text-ink/80 italic sm:text-[14.5px]">
          {scenario.tagline}
        </p>

        <p className="mt-2.5 line-clamp-3 text-[14px] leading-relaxed text-muted sm:text-[14.5px]">
          {scenario.blurb}
        </p>

        {scenario.topic && (
          <p className="mt-3 text-[11px] font-semibold tracking-[0.1em] text-accent uppercase">
            <span className="text-muted">Topic · </span>
            {scenario.topic}
          </p>
        )}

        <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/[0.06] px-4 py-3">
          <p className="text-[10.5px] font-bold tracking-[0.14em] text-accent uppercase">
            What you will learn
          </p>
          <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-ink/75">
            {scenario.learningGoal}
          </p>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-line pt-3.5">
            <span className="shrink-0 text-[11px] tracking-[0.12em] whitespace-nowrap text-muted uppercase">
              {scenario.difficulty}
              <span
                className="ml-2 inline-flex -translate-y-[0.12em] gap-1 align-middle"
                aria-hidden
              >
                {[0, 1, 2].map((pip) => (
                  <span
                    key={pip}
                    className={`h-1 w-3 rounded-full ${
                      pip < pips ? "bg-accent" : "bg-ink/15"
                    }`}
                  />
                ))}
              </span>
            </span>

            <span className="text-[12.5px] leading-snug text-muted">
              You play the{" "}
              <span className="text-ink">{scenario.intro.role}</span>
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13.5px] font-bold text-primary-ink italic shadow-[0_4px_0_var(--press),0_10px_22px_rgba(23,23,23,0.22)] transition duration-200 ease-[var(--ease-bounce)] group-hover:-translate-y-0.5 group-active:shadow-[0_1px_0_var(--press),0_4px_10px_rgba(23,23,23,0.18)]">
            {armed ? "Starting…" : "Start"}
            <span
              aria-hidden
              className="not-italic transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </span>

          {showShortcutHint && index < 9 && (
            <span className="hidden text-[12.5px] text-muted sm:inline">
              press{" "}
              <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[11.5px] text-muted">
                {index + 1}
              </kbd>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
