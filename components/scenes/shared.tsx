"use client";

import { Fragment, useState } from "react";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { STORY_PARTS } from "@/constants/story";
import { storyEmoji } from "@/utils/story-visual";
import { StorySimulation } from "@/components/story-simulation";
import type {
  Scene,
  ScenePrimer,
  SceneLearningReference,
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
        <div
          key={i}
          className="animate-rise motion-reduce:animate-none"
          style={{ animationDelay: `${i * 110}ms` }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            skipHtml
            components={{
              p: ({ children }) => (
                <p
                  className={`mb-4 text-[17px] leading-[1.7] text-ink/85 last:mb-0 ${
                    i === 0 ? "font-medium" : ""
                  }`}
                >
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-extrabold tracking-tight text-ink">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="font-semibold italic text-ink">{children}</em>
              ),
              h2: ({ children }) => (
                <h2 className="mt-7 mb-3 text-[24px] font-semibold tracking-tight text-ink">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-6 mb-2 text-[20px] font-semibold tracking-tight text-ink">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="my-4 list-disc space-y-2 pl-6 text-[17px] leading-[1.65] text-ink/85">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-4 list-decimal space-y-2 pl-6 text-[17px] leading-[1.65] text-ink/85">
                  {children}
                </ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-accent/45 bg-accent/[0.06] px-4 py-3 italic text-ink/80">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="my-5 w-full overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-max table-fixed border-collapse text-left text-[15px]">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border-b border-line bg-ink/[0.05] px-4 py-3 font-bold text-ink">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-line/70 px-4 py-3 text-ink/80">
                  {children}
                </td>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent underline underline-offset-2"
                >
                  {children}
                </a>
              ),
            }}
          >
            {line}
          </ReactMarkdown>
        </div>
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

export function LearningReferenceCard({
  reference,
}: {
  reference: SceneLearningReference;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <aside className="animate-rise overflow-hidden rounded-2xl border border-sage/30 bg-sage/[0.06] shadow-[0_3px_0_rgba(55,94,73,0.08)] motion-reduce:animate-none">
      <div className="bg-white/70 p-3">
        {imageFailed ? (
          <div className="grid min-h-36 place-items-center rounded-xl bg-sage/[0.08] px-6 text-center text-[14px] leading-relaxed text-ink/65">
            The source image is unavailable, but its explanation and attribution
            remain below.
          </div>
        ) : (
          // Exa returns arbitrary open-license hosts, so this attributed reference
          // intentionally bypasses Next's fixed remote-image allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reference.imageUrl}
            alt={reference.altText}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="mx-auto max-h-[28rem] w-auto rounded-xl object-contain"
          />
        )}
      </div>
      <div className="space-y-3 border-t border-sage/20 px-5 py-4">
        <p className="text-[11px] font-bold tracking-[0.14em] text-sage uppercase">
          See the real thing
        </p>
        <h3 className="text-[18px] font-semibold text-ink">{reference.title}</h3>
        <p className="text-[16px] leading-relaxed text-ink/80">
          {reference.plainExplanation}
        </p>
        <p className="rounded-xl bg-white/70 px-4 py-3 text-[15px] leading-relaxed text-ink/75">
          <strong className="text-ink">Why this matters:</strong>{" "}
          {reference.whyImportant}
        </p>
        <p className="text-[12px] leading-relaxed text-faint">
          Source:{" "}
          <a
            href={reference.sourcePageUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-line underline-offset-2 hover:text-muted"
          >
            {reference.sourceName}
          </a>{" "}
          ·{" "}
          <a
            href={reference.licenseUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-line underline-offset-2 hover:text-muted"
          >
            {reference.licenseName}
          </a>
        </p>
      </div>
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

/**
 * Everything on a beat that is the same whether the learner is playing it now
 * or scrolling back past it later: the prose, the fact, the micro-lesson and
 * the model.
 *
 * Split out from the decision controls so the session can render a beat twice —
 * live at the bottom of the page, and unchanged above once it is answered —
 * without either copy drifting from the other.
 */
export function SceneBody({ scene }: { scene: Scene }) {
  const afterText = scene.text.length * 110;
  const learningBlocks = [
    "primer" in scene && scene.primer ? (
      <PrimerCard key="primer" primer={scene.primer} delay={afterText} />
    ) : null,
    scene.learningReference ? (
      <LearningReferenceCard key="reference" reference={scene.learningReference} />
    ) : null,
    scene.trivia ? (
      <TriviaCard key="trivia" trivia={scene.trivia} delay={afterText} />
    ) : null,
  ].filter((block): block is NonNullable<typeof block> => block !== null);
  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {learningBlocks.slice(0, 2)}
      {scene.simulation && (
        <StorySimulation kind={scene.simulation} guide={scene.simGuide} />
      )}
    </div>
  );
}
