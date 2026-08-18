import { Fragment } from "react";
import { STORY_PARTS } from "@/constants/story";
import { storyEmoji } from "@/utils/story-visual";
import type {
  Scene,
  ScenePrimer,
  SceneTrivia,
  StoryTakeaway,
} from "@/lib/story";

/**
 * The story copy already contains the authorial cues we need. Dialogue gets
 * an italic voice; measurements and times become bold anchors. This keeps the
 * prose expressive without adding markup to every authored story line.
 */
export function StoryCopy({ text }: { text: string }) {
  return (
    <>
      {text.split(STORY_PARTS).map((part, index) => {
        if (part.startsWith("“")) {
          return (
            <em key={index} className="font-semibold italic text-ink">
              {part}
            </em>
          );
        }
        if (/^\$?\d/.test(part)) {
          return (
            <strong key={index} className="font-extrabold tracking-tight text-ink">
              {part}
            </strong>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

export function Narration({ text }: { text: string[] }) {
  return (
    <div className="space-y-4">
      {text.map((line, i) => (
        <p
          key={i}
          className={`animate-rise text-[17px] leading-[1.7] text-ink/85 motion-reduce:animate-none ${
            i === 0 ? "font-medium" : ""
          }`}
          style={{ animationDelay: `${i * 110}ms` }}
        >
          <StoryCopy text={line} />
        </p>
      ))}
    </div>
  );
}

/**
 * The micro-lesson card.
 *
 * A story earns the right to say "marker" or "resonance" only after this card
 * has said what the word means without any other jargon in the sentence. It is
 * pinned into the flow rather than hidden behind a tooltip: a learner who has
 * to hunt for the definition has already lost the thread.
 *
 * Sized to sit inside the existing sheet — it adds a block, never width.
 */
export function PrimerCard({
  primer,
  delay = 0,
}: {
  primer: ScenePrimer | ScenePrimer[];
  delay?: number;
}) {
  const list = Array.isArray(primer) ? primer : [primer];
  return (
    <div className="space-y-5">
      {list.map((item, i) => (
        <aside
          key={item.term}
          className="animate-rise relative -rotate-[0.4deg] rounded-2xl border-[1.5px] border-dashed border-accent/50 bg-accent/[0.07] px-5 pt-5 pb-4 shadow-[0_3px_0_rgb(var(--accent-rgb)/0.14),0_10px_24px_rgb(var(--accent-rgb)/0.08)] motion-reduce:animate-none"
          style={{ animationDelay: `${delay + i * 140}ms` }}
        >
          <span className="absolute -top-3 left-5 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-accent/50 bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/70">
            <span aria-hidden>💡</span>
            In plain words
          </span>
          <p className="text-[16px] leading-[1.6] text-ink/85">
            <strong className="font-extrabold italic tracking-tight text-ink">
              {item.term}
            </strong>
            {" — "}
            {item.plain}
          </p>
          {item.like && (
            <p className="mt-2 text-[15px] italic leading-[1.55] text-ink/70">
              Think of it like {item.like}
            </p>
          )}
        </aside>
      ))}
    </div>
  );
}

/**
 * The page's own heading.
 *
 * The rail at the top of the window names the beat too, but in 13px uppercase
 * in a corner — which reads as chrome, not as part of the story. Repeating it
 * here, with the beat's emoji, gives every page a face and makes the sheet
 * feel like a page of a book rather than a form.
 */
export function SceneHeading({
  scene,
  className = "",
}: {
  scene: Scene;
  className?: string;
}) {
  return (
    <p
      className={`animate-rise flex items-center gap-2 text-[13px] font-extrabold tracking-[0.14em] text-ink/55 uppercase motion-reduce:animate-none ${className}`}
    >
      <span aria-hidden className="text-[17px] leading-none">
        {storyEmoji(scene.visual.kind)}
      </span>
      <span className="min-w-0 truncate">{scene.beat}</span>
    </p>
  );
}

/**
 * The "did you know" card.
 *
 * Deliberately the only block on the page a learner may skip with nothing
 * lost. It exists to buy a breath between decisions and to make the world feel
 * inhabited — the siege engine really was built, the bridge really did fall.
 * Styled unlike the primer on purpose: dashed orange means "you need this",
 * this soft slate card means "enjoy this".
 */
export function TriviaCard({
  trivia,
  delay = 0,
}: {
  trivia: SceneTrivia;
  delay?: number;
}) {
  return (
    <aside
      className="animate-rise relative rotate-[0.35deg] rounded-2xl border-[1.5px] border-ink/12 bg-ink/[0.035] px-5 pt-5 pb-4 shadow-[0_3px_0_rgba(23,23,23,0.05)] motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="absolute -top-3 left-5 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink/15 bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-[0.14em] text-ink/60 uppercase">
        <span aria-hidden>{trivia.emoji}</span>
        Did you know
      </span>
      <p className="text-[15px] leading-[1.6] text-ink/80">
        <strong className="font-extrabold tracking-tight text-ink italic">
          {trivia.title}
        </strong>
        {" — "}
        <StoryCopy text={trivia.text} />
      </p>
    </aside>
  );
}

/**
 * The last thing a learner sees before the profile. The profile is about *how
 * they think*; this is about *what they now know*. Without it a story is an
 * enjoyable hour that names nothing — the learner cannot say what they learned,
 * so they cannot notice the same idea the next time it turns up wearing
 * different clothes. Hence `elsewhere`: the concept is only worth carrying if
 * it is portable.
 */
export function TakeawayCard({
  takeaway,
  delay = 0,
}: {
  takeaway: StoryTakeaway;
  delay?: number;
}) {
  return (
    <section
      className="animate-rise relative rounded-2xl border-[1.5px] border-accent/45 bg-accent/[0.06] px-6 pt-7 pb-6 shadow-[0_5px_0_rgb(var(--accent-rgb)/0.16),0_18px_38px_rgb(var(--accent-rgb)/0.10)] motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-accent/45 bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-[0.14em] text-ink/70 uppercase">
        <span aria-hidden>🧠</span>
        What you now know
      </span>

      <h3 className="text-[23px] leading-[1.2] font-extrabold tracking-tight text-ink italic">
        {takeaway.concept}
      </h3>
      <p className="mt-1 text-[13px] font-bold tracking-[0.14em] text-ink/70 uppercase">
        {takeaway.field}
      </p>

      <p className="mt-5 text-[17px] leading-[1.7] text-ink/85">
        {takeaway.inOneLine}
      </p>

      <p className="mt-4 border-l-[3px] border-accent/45 pl-4 text-[16px] leading-[1.65] text-ink/80 italic">
        {takeaway.rule}
      </p>

      <TakeawayList title="The same idea, elsewhere" items={takeaway.elsewhere} />
      <TakeawayList title="Where you used it tonight" items={takeaway.youUsedIt} />
    </section>
  );
}

function TakeawayList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6">
      <p className="text-[12.5px] font-extrabold tracking-[0.16em] text-ink/70 uppercase">
        {title}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[15.5px] leading-[1.6] text-ink/80">
            <span className="mt-[10px] size-1.5 shrink-0 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
