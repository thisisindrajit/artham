"use client";

import { useState } from "react";
import { cardInteractive, cardSoft, storyOption } from "@/constants/ui";
import type { SessionPreludeProps } from "@/types/components";

/**
 * One question before the story, so Artham has something to watch from.
 *
 * Once answered it does not disappear — it becomes the first line of the
 * transcript, showing the learner the instinct they arrived with. Half the
 * point of the profile at the end is comparing that instinct with what they
 * actually did.
 */
export function SessionPrelude({
  scenario,
  prelude,
  answered,
  onAnswer,
}: SessionPreludeProps) {
  const question = prelude?.question ?? scenario.preSession;
  const greeting = prelude?.greeting ?? scenario.partnerGreeting;
  const [draft, setDraft] = useState("");

  return (
    <div className="scroll-mt-28 space-y-6">
      <div className="animate-rise motion-reduce:animate-none">
        <p className="mb-2 text-[12.5px] font-bold tracking-[0.18em] text-muted uppercase">
          Artham
        </p>
        <p className="text-[17px] leading-relaxed text-ink/90">{greeting}</p>
      </div>

      <div
        className="animate-rise space-y-3 motion-reduce:animate-none"
        style={{ animationDelay: "180ms" }}
      >
        <p className="text-[17px] leading-relaxed text-ink/90">
          {answered?.question ?? question.prompt}
        </p>

        {answered ? (
          <p className="rounded-2xl border border-line bg-accent/[0.06] px-5 py-4 text-[16px] leading-[1.5] text-ink/80 italic">
            <span aria-hidden className="mr-2 not-italic">
              💬
            </span>
            You said: {answered.answer}
          </p>
        ) : question.options.length > 0 ? (
          <div className="grid gap-2.5">
            {question.options.map((option, index) => (
              <button
                key={option.id}
                onClick={() =>
                  onAnswer(question.prompt, option.label, option.approach)
                }
                data-press="deep"
                className={`${cardSoft} ${cardInteractive} ${storyOption} animate-rise rounded-2xl px-5 py-4 text-left text-[16px] font-semibold text-ink motion-reduce:animate-none`}
                style={{ animationDelay: `${260 + index * 70}ms` }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              placeholder={
                question.placeholder ??
                "Share what you would try first and why..."
              }
              className="w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-[16px] leading-relaxed text-ink shadow-inner outline-none placeholder:text-faint focus:border-accent/45 focus:ring-4 focus:ring-accent/10"
            />
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={() => onAnswer(question.prompt, draft.trim())}
              data-press="deep"
              className={`${cardSoft} ${cardInteractive} ${storyOption} rounded-2xl px-5 py-3 text-[15px] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Share my thinking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
