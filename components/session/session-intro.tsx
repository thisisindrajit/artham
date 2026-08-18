import { buttonPrimary, storyTag } from "@/constants/ui";
import type { SessionIntroProps } from "@/types/components";
import { Narration } from "@/components/scenes";

export function SessionIntro({ scenario, onBegin }: SessionIntroProps) {
  return (
    <div className="space-y-8">
      <div className="animate-rise space-y-2 motion-reduce:animate-none">
        <p
          className={`${storyTag} inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic tracking-[0.16em] uppercase`}
        >
          {scenario.minutes}-minute story · {scenario.difficulty}
        </p>
        <h1 className="text-[30px] font-light tracking-tight text-ink sm:text-[32px]">
          {scenario.title}
        </h1>
        <p className="text-[15.5px] text-muted">
          You are the {scenario.intro.role}.
        </p>
      </div>
      <Narration text={scenario.intro.text} />
      <button
        onClick={onBegin}
        data-press="deep"
        className={`${buttonPrimary} animate-rise inline-flex items-center gap-3 rounded-full px-6 py-3 text-[16px] font-bold italic motion-reduce:animate-none`}
        style={{
          animationDelay: `${scenario.intro.text.length * 110 + 160}ms`,
        }}
      >
        {scenario.intro.cta}
        <span aria-hidden className="not-italic">
          →
        </span>
      </button>
    </div>
  );
}
