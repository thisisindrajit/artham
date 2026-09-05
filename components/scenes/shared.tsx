"use client";

import { Fragment, useState, type ReactNode } from "react";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { STORY_PARTS } from "@/constants/story";
import { storyEmoji } from "@/utils/story-visual";
import { remarkStoryDialogue } from "@/utils/story-markdown";
import { StorySimulation } from "@/components/story-simulation";
import { MermaidDiagram } from "@/components/scenes/mermaid-diagram";
import {
  annotateTerms,
  type GlossaryEntry,
} from "@/components/scenes/term-tooltip";
import type {
  Scene,
  ScenePrimer,
  SceneLearningReference,
  SceneTrivia,
  StoryCitation,
  StoryTakeaway,
} from "@/lib/story";

/**
 * The story copy already contains the authorial cues we need. Dialogue gets
 * a bold italic voice; measurements and times become underlined bold anchors. This keeps the
 * prose expressive without adding markup to every authored story line.
 */
export function StoryCopy({ text }: { text: string }) {
  return (
    <>
      {text.split(STORY_PARTS).map((part, index) => {
        if (part.startsWith("“") || part.startsWith('"')) {
          return (
            <em key={index} className="font-extrabold italic text-ink">
              {part}
            </em>
          );
        }
        if (/^\$?\d/.test(part)) {
          return (
            <strong key={index} className="font-extrabold tracking-tight text-ink underline underline-offset-4">
              {part}
            </strong>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

/**
 * Small numbered links to the story's supporting sources, in the style of a
 * research-paper footnote: "[1]" opens the cited source in a new tab.
 *
 * Renders nothing when there are no refs or no citations to resolve them
 * against, so it is safe to drop into any scene/trivia unconditionally.
 */
export function CitationMarks({
  refs,
  citations,
}: {
  refs?: number[];
  citations?: StoryCitation[];
}) {
  if (!refs?.length || !citations?.length) return null;
  const valid = refs.filter((ref) => citations[ref - 1]);
  if (!valid.length) return null;
  return (
    <span className="ml-1 inline-flex gap-1 align-super text-[11px] font-semibold text-accent">
      {valid.map((ref) => (
        <a
          key={ref}
          href={citations[ref - 1].url}
          target="_blank"
          rel="noreferrer"
          title={citations[ref - 1].sourceName ?? citations[ref - 1].title}
          className="hover:underline"
        >
          [{ref}]
        </a>
      ))}
    </span>
  );
}

export function Narration({
  text,
  glossary,
}: {
  text: string[];
  /** Key terms to annotate with a plain-words tooltip on first mention. */
  glossary?: GlossaryEntry[];
}) {
  const seen = new Set<string>();
  const annotate = (children: ReactNode) =>
    glossary?.length ? annotateTerms(children, glossary, seen) : children;
  return (
    <div className="story-prose space-y-4">
      {text.map((line, i) => (
        <div
          key={i}
          className="animate-rise motion-reduce:animate-none"
          style={{ animationDelay: `${i * 110}ms` }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkStoryDialogue]}
            rehypePlugins={[rehypeKatex]}
            skipHtml
            components={{
              p: ({ children }) => (
                <p
                  className="mb-4 text-[17px] font-normal leading-[1.7] text-ink/85 last:mb-0"
                >
                  {annotate(children)}
                </p>
              ),
              strong: ({ children }) => (
                <strong className={`tracking-tight text-ink ${
                  typeof children === "string" && /^[“"]/.test(children.trim())
                    ? "story-dialogue" : ""
                }`}>
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="text-ink">{children}</em>
              ),
              h1: ({ children }) => (
                <h2 className="mt-7 mb-3 text-[26px] font-semibold tracking-tight text-ink capitalize">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h2 className="mt-7 mb-3 text-[24px] font-semibold tracking-tight text-ink capitalize">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-6 mb-2 text-[20px] font-semibold tracking-tight text-ink capitalize">
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
              code: ({ className, children }) => {
                const isMermaid = /language-mermaid/.test(className ?? "");
                if (isMermaid) {
                  return <MermaidDiagram chart={String(children)} />;
                }
                return (
                  <code className={`${className ?? ""} rounded bg-ink/[0.06] px-1.5 py-0.5 text-[14px] text-ink`}>
                    {children}
                  </code>
                );
              },
              pre: ({ children, node }) => {
                const diagram = node?.children.some(
                  (child) =>
                    child.type === "element" &&
                    child.tagName === "code" &&
                    Array.isArray(child.properties.className) &&
                    child.properties.className.includes("language-mermaid"),
                );
                return diagram ? <>{children}</> : (
                  <pre className="my-5 overflow-x-auto rounded-xl border border-line bg-ink/[0.04] p-4 leading-relaxed [&>code]:block [&>code]:bg-transparent [&>code]:p-0">
                    {children}
                  </pre>
                );
              },
            }}
          >
            {line}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
}

export function PrimerCard({
  primer,
  delay = 0,
}: {
  primer: ScenePrimer | ScenePrimer[];
  delay?: number;
}) {
  const list = Array.isArray(primer) ? primer : [primer];
  if (list.length === 0) return null;

  return (
    <aside
      className="animate-rise rounded-2xl border border-accent/25 bg-accent/[0.05] px-4 py-3 motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
      aria-label="In plain words"
    >
      <p className="mb-3 text-[15px] font-bold tracking-wide text-ink/70 capitalize">
        In plain words
      </p>
      <div className="space-y-3">
        {list.map((item) => (
          <div
            key={item.term}
            className="rounded-xl border border-accent/20 bg-white/70 px-3.5 py-3"
          >
            <h3 className="text-[18px] font-bold text-ink capitalize">{item.term}</h3>
            <p className="mt-1 text-[15px] leading-[1.6] text-ink/75">
              {item.plain}
            </p>
            {item.like && (
              <p className="mt-1.5 text-[14px] leading-[1.5] text-ink/65">
                <span className="font-semibold text-ink/70">Example:</span>{" "}
                {item.like}
              </p>
            )}
          </div>
        ))}
      </div>
    </aside>
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
      className={`animate-rise flex items-center gap-2 text-[18px] font-extrabold tracking-wide text-ink/70 capitalize motion-reduce:animate-none ${className}`}
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
 * A warm amber surface distinguishes optional trivia from the lesson cards.
 */
export function TriviaCard({
  trivia,
  citations,
  delay = 0,
}: {
  trivia: SceneTrivia;
  citations?: StoryCitation[];
  delay?: number;
}) {
  return (
    <aside
      className="animate-rise relative rotate-[0.35deg] rounded-2xl border-[1.5px] border-amber-300 bg-amber-50 px-5 pt-6 pb-4 shadow-[0_3px_0_rgba(217,119,6,0.12)] motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="absolute -top-3 left-5 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[14px] font-bold tracking-wide text-amber-950 capitalize">
        <span aria-hidden>{trivia.emoji}</span>
        Did you know
      </span>
      <div className="text-[15px] leading-[1.6] text-ink/80">
        <h3 className="mb-1 text-[18px] font-extrabold tracking-tight text-ink capitalize">
          {trivia.title}
        </h3>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          skipHtml
          components={{
            p: ({ children }) => <span>{children}</span>,
          }}
        >
          {trivia.text}
        </ReactMarkdown>
        <CitationMarks refs={trivia.citationRefs} citations={citations} />
      </div>
    </aside>
  );
}

export function LearningReferenceCard({
  reference,
  citations,
}: {
  reference: SceneLearningReference;
  citations?: StoryCitation[];
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
        <p className="text-[15px] font-bold tracking-wide text-sage capitalize">
          See the real thing
        </p>
        <h3 className="text-[20px] font-semibold text-ink capitalize">{reference.title}</h3>
        <p className="text-[16px] leading-relaxed text-ink/80">
          {reference.plainExplanation}
          <CitationMarks refs={reference.citationRefs} citations={citations} />
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
      <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-accent/45 bg-white px-2.5 py-0.5 text-[14px] font-bold tracking-wide text-ink/70 capitalize">
        <span aria-hidden>🧠</span>
        What you now know
      </span>

      <h3 className="text-[23px] leading-[1.2] font-extrabold tracking-tight text-ink capitalize">
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
      <p className="text-[15px] font-extrabold tracking-wide text-ink/70 capitalize">
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
export function SceneBody({
  scene,
  citations,
  glossary,
}: {
  scene: Scene;
  /** Key terms to annotate with a plain-words tooltip on first mention. */
  glossary?: GlossaryEntry[];
  /**
   * Numbered source list for the story. Passed down so the scene's own
   * `citationRefs` and its trivia's `citationRefs` can both render "[1]"
   * style links. An activity's explanation always cites the same sources as
   * its parent scene, so these marks also cover the activity's claims —
   * they are not duplicated separately in the activity controls.
   */
  citations?: StoryCitation[];
}) {
  const afterText = scene.text.length * 110;
  const learningBlocks = [
    "primer" in scene && scene.primer ? (
      <PrimerCard key="primer" primer={scene.primer} delay={afterText} />
    ) : null,
    scene.learningReference ? (
      <LearningReferenceCard key="reference" reference={scene.learningReference} citations={citations} />
    ) : null,
    scene.trivia ? (
      <TriviaCard
        key="trivia"
        trivia={scene.trivia}
        citations={citations}
        delay={afterText}
      />
    ) : null,
  ].filter((block): block is NonNullable<typeof block> => block !== null);
  return (
    <div className="space-y-8">
      <div>
        <Narration text={scene.text} glossary={glossary} />
        <CitationMarks refs={scene.citationRefs} citations={citations} />
      </div>
      {learningBlocks.slice(0, 2)}
      {scene.simulation && (
        <StorySimulation kind={scene.simulation} guide={scene.simGuide} />
      )}
    </div>
  );
}
