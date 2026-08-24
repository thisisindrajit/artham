"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ThinkingProfile } from "@/types/partner";
import type { Scenario, SessionNotes } from "@/lib/story";
import { PaperBackdrop } from "./paper-backdrop";
import { buttonPrimary, card, cardSoft } from "@/constants/ui";
import { thinkingProfileStorageKey } from "@/lib/thinking-profile-storage";

/** The emotional payoff. Every claim carries the evidence that produced it. */
export function ProfileView({
  scenario,
  profile,
  notes,
  learnerId,
}: {
  scenario: Scenario;
  profile: ThinkingProfile | null;
  notes: SessionNotes;
  learnerId: string;
}) {
  useEffect(() => {
    if (profile) {
      window.localStorage.setItem(
        thinkingProfileStorageKey(learnerId),
        JSON.stringify(profile),
      );
    }
  }, [learnerId, profile]);

  if (!profile) {
    return (
      <div
        data-domain={scenario.domain}
        data-mood="insight"
        className="relative isolate grid min-h-dvh place-items-center px-6"
      >
        <PaperBackdrop />
        <div className="space-y-3 text-center">
          <p className="animate-pulse-soft text-[13px] font-bold italic tracking-[0.18em] text-ink uppercase motion-reduce:animate-none">
            Artham is replaying your choices
          </p>
          <p className="text-[16px] text-faint">
            {notes.observations.length} observation
            {notes.observations.length === 1 ? "" : "s"} ·{" "}
            {notes.decisions.length} decisions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-domain={scenario.domain}
      data-mood="insight"
      className="relative isolate min-h-dvh px-6 py-16"
    >
      <PaperBackdrop />
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header
          className={`${card} animate-rise space-y-6 rounded-3xl px-7 py-10 text-center motion-reduce:animate-none sm:px-10`}
        >
          <div
            aria-hidden
            className="mx-auto grid size-16 place-items-center rounded-[1.4rem] bg-accent/12 text-4xl shadow-[0_4px_0_rgb(var(--accent-rgb)/0.2)]"
          >
            🧠
          </div>
          <p className="text-[13px] font-bold italic tracking-[0.18em] text-ink uppercase">
            Your thinking pattern unlocked
          </p>
          <div className="space-y-2">
            <h1 className="text-4xl font-light tracking-tight text-ink">
              {profile.archetype}
            </h1>
            <ConfidenceMeter score={profile.score} />
          </div>
          <p className="mx-auto max-w-md text-[19.5px] leading-relaxed text-ink/85">
            {profile.summary}
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Panel
            eyebrow="✨ Your superpower"
            title={profile.strength.title}
            body={profile.strength.evidence}
            accent="sage"
            delay={120}
          />
          <Panel
            eyebrow="🧩 Your next unlock"
            title={profile.blindSpot.title}
            body={profile.blindSpot.evidence}
            accent="rose"
            delay={200}
          />
          <Panel
            eyebrow="🔎 Artham noticed"
            title=""
            body={profile.noticed}
            accent="accent"
            delay={280}
          />
          <Panel
            eyebrow="🌱 To improve"
            title=""
            body={profile.blindSpot.evidence}
            accent="ink"
            delay={360}
          />
        </div>

        <section className={`${card} animate-rise rounded-3xl px-6 py-7 motion-reduce:animate-none`}>
          <p className="text-[12px] font-bold tracking-[0.2em] text-accent uppercase">
            Small things Artham captured
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {profile.details.map((detail) => (
              <article
                key={`${detail.title}-${detail.evidence}`}
                className="rounded-2xl border border-line bg-white/60 px-4 py-4"
              >
                <h2 className="text-[16px] font-semibold capitalize text-ink">
                  {detail.title}
                </h2>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink/75">
                  {detail.observation}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-faint">
                  {detail.evidence}
                </p>
              </article>
            ))}
          </div>
        </section>

        <Evidence notes={notes} profile={profile} />

        <footer className="animate-rise flex flex-wrap items-center justify-center gap-4 pt-4 motion-reduce:animate-none">
          <Link
            href="/explore"
            data-press="deep"
            className={`${buttonPrimary} rounded-full px-6 py-3 text-[16px] font-medium`}
          >
            Explore another story →
          </Link>
          <Link
            href={scenario.playPath ?? `/play/${scenario.id}`}
            className="rounded-full border border-ink/15 bg-white/75 px-6 py-3 text-[16px] font-medium text-muted transition hover:-translate-y-0.5 hover:text-ink"
          >
            ↻ Do this story again
          </Link>
        </footer>

        {profile.fallback && (
          <p className="text-center text-[13px] text-faint">
            Built directly from the choices and revisions in this story.
          </p>
        )}
      </div>
    </div>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const strength =
    score >= 75 ? "clear pattern" : score >= 50 ? "some signal" : "early hunch";
  const filled = Math.max(1, Math.round(score / 20));

  return (
    <div
      aria-label={`Pattern strength ${score} percent`}
      className="mx-auto flex items-center justify-center gap-3"
    >
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-5 rounded-full ${
              i < filled ? "bg-accent" : "bg-line"
            }`}
          />
        ))}
      </div>
      <span className="text-[14px] text-muted">{strength}</span>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  body,
  accent,
  delay,
}: {
  eyebrow: string;
  title: string;
  body: string;
  accent: "sage" | "rose" | "accent" | "ink";
  delay: number;
}) {
  const color = {
    sage: "text-sage",
    rose: "text-rose",
    accent: "text-ink",
    ink: "text-muted",
  }[accent];

  return (
    <section
      className={`${card} animate-rise rounded-2xl px-6 py-6 motion-reduce:animate-none`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className={`mb-3 text-[12px] tracking-[0.2em] uppercase ${color}`}>
        {eyebrow}
      </p>
      {title && (
        <h2 className="mb-1.5 text-[21px] font-medium text-ink">{title}</h2>
      )}
      <p className="text-[17px] leading-relaxed text-muted">{body}</p>
    </section>
  );
}

function Evidence({
  notes,
  profile,
}: {
  notes: SessionNotes;
  profile: ThinkingProfile;
}) {
  return (
    <details className={`${cardSoft} animate-rise group rounded-2xl px-6 py-5 motion-reduce:animate-none`}>
      <summary className="cursor-pointer list-none text-[13px] tracking-[0.2em] text-faint uppercase transition group-open:text-muted hover:text-muted">
        Want the receipts?
      </summary>

      <div className="mt-5 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Stat label="Decisions" value={profile.stats.decisions} />
          <Stat label="First try" value={profile.stats.firstTryCorrect} />
          <Stat label="Corrections" value={profile.stats.selfCorrections} />
          <Stat label="Hints" value={profile.stats.hintsUsed} />
        </div>

        {notes.observations.length > 0 && (
          <ul className="space-y-3">
            {notes.observations.map((o, i) => (
              <li key={i} className="border-l border-line pl-4">
                <p className="text-[16px] text-ink/85">{o.observation}</p>
                <p className="mt-0.5 text-[14px] leading-relaxed text-faint">
                  {o.evidence}
                </p>
                <p className="mt-1 text-[12px] tracking-wider text-faint uppercase">
                  {o.category} · {signalFor(o.confidence)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {notes.reasoningSamples.length > 0 && (
          <div className="space-y-3">
            {notes.reasoningSamples.map((r, i) => (
              <div key={i} className="border-l border-accent/30 pl-4">
                <p className="text-[14px] text-faint">{r.question}</p>
                <p className="mt-1 text-[16px] text-ink/85 italic">
                  “{r.answer}”
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function signalFor(confidence: number): string {
  if (confidence >= 0.75) return "strong signal";
  if (confidence >= 0.55) return "some signal";
  return "early hunch";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className={`font-mono tabular-nums text-[28px] font-light text-ink`}>{value}</p>
      <p className="text-[12px] tracking-[0.14em] text-faint uppercase">
        {label}
      </p>
    </div>
  );
}
