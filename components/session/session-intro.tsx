import { buttonPrimary, storyTag } from "@/constants/ui";
import { DIFFICULTY_PIPS, DOMAIN_LABELS } from "@/constants/story";
import type { SessionIntroProps } from "@/types/components";
import { Narration } from "@/components/scenes";
import { StoryImage } from "@/components/story-image";

/**
 * The briefing.
 *
 * A learner arriving at a story used to get five lines of atmosphere and a
 * button, then spent the first two beats working out what kind of thing they
 * were in. So this says it plainly before the fiction starts: the subject, the
 * job, the situation, and — named up front, not saved for the credits — the
 * idea they will be able to use by the end.
 *
 * It stays on the page after the story begins. On a continuous page the opening
 * frame is the thing a confused learner scrolls back to first.
 */
export function SessionIntro({ scenario, started, onBegin }: SessionIntroProps) {
  const pips = DIFFICULTY_PIPS[scenario.difficulty];
  const role = scenario.intro.role.trim();
  const blurb = scenario.blurb.trim();
  const escapedRole = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const roleLead = new RegExp(
    `^You are the ${escapedRole}\\.\\s*(?:Take charge as the ${escapedRole}\\.?\\s*)?`,
    "i",
  );
  const compactBlurb = blurb.replace(roleLead, "").trim();
  const roleWords = role
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= 5);
  const mentionsRole = roleWords.some((word) =>
    new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      compactBlurb,
    ),
  );
  const introSummary = compactBlurb
    ? mentionsRole
      ? compactBlurb
      : `You are the ${role}. ${compactBlurb}`
    : `You are the ${role}.`;

  return (
    <section className="space-y-8">
      <div className="animate-rise space-y-3 motion-reduce:animate-none">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={`${storyTag} inline-flex rounded-full px-3 py-1 text-[12.5px] font-bold italic tracking-[0.14em] uppercase`}
          >
            {DOMAIN_LABELS[scenario.domain]}
          </span>
          <span className="text-[12.5px] font-semibold tracking-[0.08em] text-ink/60 capitalize">
            {scenario.topic ?? scenario.takeaway.field}
          </span>
          <span className="text-[12.5px] font-semibold tracking-[0.12em] text-faint uppercase">
            {scenario.minutes} min
            <span aria-hidden className="mx-2 text-accent">
              {"●".repeat(pips)}
              <span className="text-ink/15">{"●".repeat(3 - pips)}</span>
            </span>
            {scenario.difficulty}
          </span>
        </div>
        <h1 className="text-[32px] leading-[1.1] font-light tracking-tight text-ink sm:text-[38px]">
          {scenario.title}
        </h1>
        <p className="text-[17px] leading-[1.6] text-ink/75">
          {introSummary}
        </p>
      </div>

      <dl
        className="animate-rise grid gap-5 rounded-2xl border-[1.5px] border-dashed border-accent/45 bg-accent/[0.06] px-5 py-5 motion-reduce:animate-none sm:grid-cols-2"
        style={{ animationDelay: "120ms" }}
      >
        <div>
          <dt className="text-[11.5px] font-extrabold tracking-[0.15em] text-ink/55 uppercase">
            <span aria-hidden className="mr-1.5">
              🎯
            </span>
            What you are here to work out
          </dt>
          <dd className="mt-1.5 text-[15.5px] leading-[1.55] text-ink/80">
            {scenario.learningGoal}
          </dd>
        </div>
        <div>
          <dt className="text-[11.5px] font-extrabold tracking-[0.15em] text-ink/55 uppercase">
            <span aria-hidden className="mr-1.5">
              🧠
            </span>
            What you will walk away with
          </dt>
          <dd className="mt-1.5 text-[15.5px] leading-[1.55] text-ink/80">
            <strong className="font-extrabold italic tracking-tight text-ink">
              {scenario.takeaway.concept}
            </strong>{" "}
            — {scenario.takeaway.inOneLine}
          </dd>
        </div>
      </dl>

      <StoryImage visual={scenario.intro.visual} priority />
      <Narration text={scenario.intro.text} />

      {!started && (
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
      )}
    </section>
  );
}
