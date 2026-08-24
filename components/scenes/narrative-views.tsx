import type { StoryTakeaway } from "@/lib/story";
import type { BeatAttempt } from "@/utils/story-trail";
import { PrimaryButton } from "./controls";
import { StoryCopy, TakeawayCard } from "./shared";

/** A beat whose only move is "keep reading". */
export function NarrativeControls({ onAdvance }: { onAdvance: () => void }) {
  return <PrimaryButton onClick={onAdvance} label="Continue" />;
}

export function EndingControls({
  takeaway,
  onFinish,
}: {
  takeaway: StoryTakeaway;
  onFinish: () => void;
}) {
  return (
    <div className="space-y-8">
      <TakeawayCard takeaway={takeaway} />
      <PrimaryButton onClick={onFinish} label="See what Artham noticed" delay={180} />
    </div>
  );
}

/**
 * What the world did because of one attempt.
 *
 * Every try the learner makes leaves one of these behind, right where it
 * happened, and they are never cleared. That is the point of the continuous
 * page: scrolling up shows not only what the story said but what they did to it
 * and what came back.
 */
export function OutcomeCard({
  choice,
  text,
  tone,
}: {
  /** What the learner did, in the option's own words. */
  choice?: string;
  text?: string;
  tone: BeatAttempt["tone"];
}) {
  const skin = OUTCOME_SKIN[tone];
  return (
    <div
      className={`animate-slide-up -rotate-[0.35deg] rounded-2xl border-[1.5px] px-5 py-4 shadow-[0_4px_0_rgba(23,23,23,0.07),0_14px_30px_rgba(23,23,23,0.07)] motion-reduce:animate-none ${skin.box}`}
    >
      <p className="text-[12.5px] font-extrabold italic tracking-[0.16em] text-ink/75 uppercase">
        <span aria-hidden className="mr-1.5 not-italic">
          {skin.emoji}
        </span>
        {skin.label}
      </p>
      {choice && (
        <p className="mt-2 text-[14.5px] leading-[1.5] text-ink/65 italic">
          You went with: {choice}
        </p>
      )}
      {text && (
        <p className="mt-2.5 text-[17px] leading-[1.7] text-ink/85">
          <StoryCopy text={text} />
        </p>
      )}
    </div>
  );
}

const OUTCOME_SKIN = {
  success: { box: "border-sage/25 bg-sage/10", emoji: "✅", label: "That worked" },
  warning: { box: "border-rose/25 bg-rose/10", emoji: "⚠️", label: "Meanwhile…" },
  note: { box: "border-ink/12 bg-ink/[0.035]", emoji: "📝", label: "You wrote" },
} as const;
