"use client";

import { Fragment, isValidElement, cloneElement, type ReactNode } from "react";
import type { ScenePrimer } from "@/types/story";

/**
 * A key term the learner can hover or tap to get its plain-words meaning
 * without leaving the sentence they are reading.
 */
export type GlossaryEntry = { term: string; plain: string; like?: string };

/**
 * Every term the story itself already explains, collected once for the whole
 * scenario so a term primed in scene 2 still carries its meaning in scene 5.
 *
 * Primers are the story's own plain-language definitions, so reusing them
 * keeps the tooltip and the primer card from ever disagreeing.
 */
export function buildGlossary(
  scenes: { primer?: ScenePrimer | ScenePrimer[] }[],
): GlossaryEntry[] {
  const byTerm = new Map<string, GlossaryEntry>();
  for (const scene of scenes) {
    const primers = Array.isArray(scene.primer)
      ? scene.primer
      : scene.primer
        ? [scene.primer]
        : [];
    for (const primer of primers) {
      const term = primer.term?.trim();
      if (!term || term.length < 3) continue;
      const key = term.toLowerCase();
      if (byTerm.has(key)) continue;
      byTerm.set(key, { term, plain: primer.plain, like: primer.like });
    }
  }
  // Longest first so "Fourier transform" wins over "transform".
  return [...byTerm.values()].sort((a, b) => b.term.length - a.term.length);
}

function TermTooltip({ entry }: { entry: GlossaryEntry }) {
  return (
    <span className="group relative inline-block">
      <button
        type="button"
        aria-label={`What ${entry.term} means`}
        className="cursor-help font-extrabold text-ink underline decoration-accent/70 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {entry.term}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-64 -translate-x-1/2 rounded-xl border border-line bg-white px-3 py-2.5 text-left text-[13px] leading-[1.5] text-ink/80 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <span className="mb-1 block text-[15px] font-bold text-ink capitalize">
          {entry.term}
        </span>
        {entry.plain}
        {entry.like && (
          <span className="mt-1 block text-[12px] text-ink/60">
            Like: {entry.like}
          </span>
        )}
      </span>
    </span>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps the first mention of each glossary term inside already-rendered
 * markdown children.
 *
 * Only the first mention is annotated: a dotted underline under every
 * occurrence would read as noise rather than help. `seen` is shared across one
 * scene's paragraphs so the marker lands on the earliest mention only.
 */
export function annotateTerms(
  children: ReactNode,
  glossary: GlossaryEntry[],
  seen: Set<string>,
): ReactNode {
  if (!glossary.length) return children;

  const walk = (node: ReactNode, keyPrefix: string): ReactNode => {
    if (typeof node === "string") {
      const remaining = glossary.filter(
        (entry) => !seen.has(entry.term.toLowerCase()),
      );
      for (const entry of remaining) {
        const pattern = new RegExp(`\\b${escapeRegExp(entry.term)}\\b`, "i");
        const match = pattern.exec(node);
        if (!match) continue;
        seen.add(entry.term.toLowerCase());
        const before = node.slice(0, match.index);
        const after = node.slice(match.index + match[0].length);
        return (
          <Fragment key={keyPrefix}>
            {before}
            <TermTooltip entry={{ ...entry, term: match[0] }} />
            {walk(after, `${keyPrefix}-a`)}
          </Fragment>
        );
      }
      return node;
    }
    if (Array.isArray(node)) {
      return node.map((child, index) => (
        <Fragment key={`${keyPrefix}-${index}`}>
          {walk(child, `${keyPrefix}-${index}`)}
        </Fragment>
      ));
    }
    if (isValidElement<{ children?: ReactNode }>(node) && node.props.children) {
      return cloneElement(node, {
        children: walk(node.props.children, `${keyPrefix}-c`),
      });
    }
    return node;
  };

  return walk(children, "t");
}
