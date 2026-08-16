"use client";

import Link from "next/link";
import type { ThinkingProfile } from "@/lib/partner/types";
import type { Scenario, SessionNotes } from "@/lib/story";
import { PaperBackdrop } from "./paper-backdrop";
import { buttonPrimary, card, cardSoft } from "@/lib/ui";

/** The emotional payoff. Every claim carries the evidence that produced it. */
export function ProfileView({
  scenario,
  profile,
  notes,
}: {
  scenario: Scenario;
  profile: ThinkingProfile | null;
  notes: SessionNotes;
}) {
  if (!profile) {
    return (
      <div
        data-domain={scenario.domain}
        data-mood="insight"
        className="relative isolate grid min-h-dvh place-items-center px-6"
      >
        <PaperBackdrop />
        <div className="space-y-3 text-center">
          <p className="pulse-soft text-[13px] font-bold italic tracking-[0.18em] text-ink uppercase">
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
      <div className="mx-auto w-full max-w-2xl space-y-12">
        <header
          className={`${card} rise space-y-6 rounded-3xl px-7 py-10 text-center sm:px-10`}
        >
          <p className="text-[13px] font-bold italic tracking-[0.18em] text-ink uppercase">
            Here is how you played it
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

        <div className="grid gap-4">
          <Panel
            eyebrow="What worked for you"
            title={profile.strength.title}
            body={profile.strength.evidence}
            accent="sage"
            delay={120}
          />
          <Panel
            eyebrow="Where you got caught"
            title={profile.blindSpot.title}
            body={profile.blindSpot.evidence}
            accent="rose"
            delay={200}
          />
          <Panel
            eyebrow="One interesting thing"
            title=""
            body={profile.noticed}
            accent="accent"
            delay={280}
          />
          <Panel
            eyebrow="A fun next test"
            title=""
            body={profile.tryNext}
            accent="ink"
            delay={360}
          />
        </div>

        <Evidence notes={notes} profile={profile} />

        <footer className="rise flex items-center justify-center gap-6 pt-4">
          <Link
            href={`/play/${scenario.id}`}
            data-press="deep"
            className={`${buttonPrimary} rounded-full px-6 py-3 text-[16px] font-medium`}
          >
            Try it another way
          </Link>
          <Link
            href="/"
            className="text-[16px] text-faint transition hover:text-muted"
          >
            Find another story
          </Link>
        </footer>

        {profile.fallback && (
          <p className="text-center text-[13px] text-faint">
            Built from your choices while the live partner was offline.
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
      className={`${card} rise rounded-2xl px-6 py-6`}
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
    <details className={`${cardSoft} rise group rounded-2xl px-6 py-5`}>
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
