import {
  cardInteractive,
  cardSoft,
  storyOption,
} from "@/constants/ui";
import type { SessionPreludeProps } from "@/types/components";

export function SessionPrelude({
  scenario,
  prelude,
  onAnswer,
  onPreview,
}: SessionPreludeProps) {
  const question = prelude?.question ?? scenario.preSession;
  const greeting = prelude?.greeting ?? scenario.partnerGreeting;

  return (
    <div className="space-y-8">
      <div className="animate-rise motion-reduce:animate-none">
        <p className="mb-2 text-[13px] font-medium tracking-[0.18em] text-muted uppercase">
          Artham
        </p>
        <p className="text-[17px] leading-relaxed text-ink/90">{greeting}</p>
      </div>

      <div
        className="animate-rise space-y-3 motion-reduce:animate-none"
        style={{ animationDelay: "180ms" }}
      >
        <p className="text-[17px] leading-relaxed text-ink/90">
          {question.prompt}
        </p>
        <div className="grid gap-2.5">
          {question.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() =>
                onAnswer(question.prompt, option.label, option.approach)
              }
              onMouseEnter={() =>
                onPreview(`I would start by: ${option.label}`)
              }
              onMouseLeave={() => onPreview(null)}
              onFocus={() => onPreview(`I would start by: ${option.label}`)}
              onBlur={() => onPreview(null)}
              data-press="deep"
              className={`${cardSoft} ${cardInteractive} ${storyOption} animate-rise rounded-2xl px-5 py-4 text-left text-[16px] font-semibold text-ink motion-reduce:animate-none`}
              style={{ animationDelay: `${260 + index * 70}ms` }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
