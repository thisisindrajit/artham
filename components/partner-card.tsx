"use client";

import { useEffect, useRef, useState } from "react";
import type { ObserveResponse } from "@/lib/partner/types";
import { buttonPrimary, card } from "@/lib/ui";
import { ArthamMark } from "./artham-mark";

/**
 * Artham's voice. It appears inside the scene when it has something to say and
 * leaves when it doesn't — deliberately not a persistent chat sidebar.
 */
export function PartnerCard({
  message,
  thinking,
  onAnswer,
  onDismiss,
}: {
  message: ObserveResponse | null;
  thinking: boolean;
  onAnswer: (question: string, answer: string) => void;
  onDismiss: () => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const asking = message?.action === "ask" && !!message.askFor;

  // Clear the draft when a new partner message arrives, without an effect.
  const [lastMessage, setLastMessage] = useState(message);
  if (message !== lastMessage) {
    setLastMessage(message);
    setDraft("");
  }

  useEffect(() => {
    if (asking) inputRef.current?.focus();
  }, [message, asking]);

  if (thinking) {
    return (
      <div
        className={`${card} border-[1.5px] shadow-[0_5px_0_rgba(23,23,23,0.08),0_22px_48px_rgba(23,23,23,0.12)] slide-up flex items-center gap-3 rounded-2xl px-5 py-4`}
      >
        <Sigil />
        <span className="pulse-soft text-[15px] text-muted">
          Artham is thinking…
        </span>
      </div>
    );
  }

  if (!message || message.action === "none" || !message.message.trim()) {
    return null;
  }

  return (
    <div className={`${card} border-[1.5px] shadow-[0_5px_0_rgba(23,23,23,0.08),0_22px_48px_rgba(23,23,23,0.12)] slide-up rounded-2xl`}>
      <div className="flex items-start gap-4 px-5 py-4">
        <Sigil />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[15px] font-bold italic text-ink">Artham</span>
            <Badge action={message.action} />
            {message.fallback && (
              <span
                title="Generated without the model — the story's own guidance"
                className="text-[12px] text-faint"
              >
                offline
              </span>
            )}
          </div>
          <p className="text-[16px] leading-relaxed text-ink/90">
            {message.message}
          </p>

          {asking && (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const answer = draft.trim();
                if (!answer) return;
                onAnswer(message.askFor!, answer);
                setDraft("");
              }}
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="A sentence is plenty…"
                className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[15px] text-ink outline-none placeholder:text-faint focus:border-accent/45 focus:ring-4 focus:ring-accent/10"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className={`${buttonPrimary} rounded-xl px-3.5 py-2 text-[15px] font-medium disabled:opacity-30`}
              >
                Send
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="px-2 text-[15px] text-faint transition hover:text-muted"
              >
                Skip
              </button>
            </form>
          )}
        </div>

        {!asking && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="grid size-11 shrink-0 place-items-center self-start rounded-full border-2 border-ink/15 bg-white text-[27px] leading-none font-medium text-ink shadow-[0_3px_0_rgba(23,23,23,0.14),0_8px_18px_rgba(23,23,23,0.08)] transition [--key-travel:3px] hover:-rotate-6 hover:border-accent/55 hover:bg-accent/10 active:shadow-none"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function Badge({ action }: { action: ObserveResponse["action"] }) {
  const label: Record<string, string> = {
    guide: "a tiny clue",
    ask: "curious",
    encourage: "nice catch",
    observe: "noted",
  };
  const tone: Record<string, string> = {
    guide: "text-ink",
    ask: "text-ink",
    encourage: "text-sage",
    observe: "text-muted",
  };
  if (!label[action]) return null;
  return (
    <span
      className={`rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[12px] font-bold italic shadow-[0_2px_0_rgb(var(--accent-rgb)/0.16)] ${tone[action]}`}
    >
      {label[action]}
    </span>
  );
}

function Sigil() {
  return <ArthamMark size={32} className="mt-0.5 w-[26px]" />;
}
