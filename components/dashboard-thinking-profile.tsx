"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import type { ThinkingProfile } from "@/types/partner";
import { thinkingProfileStorageKey } from "@/lib/thinking-profile-storage";

/**
 * Both hero states share one grid, one heading scale and one side panel, so
 * the card keeps the same silhouette whether or not a profile exists — the
 * empty state used to collapse into a wide column with a lone floating button.
 */
const heroGrid =
  "grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:px-10 lg:py-10";

/** Capped well below the viewport so the title does not balloon on wide screens. */
const heroHeading =
  "mt-3 text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] font-light tracking-tight text-ink";

const heroPanel =
  "flex flex-col rounded-3xl border border-ink/10 bg-white/75 p-5 shadow-[0_3px_0_rgba(23,23,23,0.06)]";

const profileCache = new Map<
  string,
  { raw: string | null; value: ThinkingProfile | null }
>();

function readProfile(learnerId: string): ThinkingProfile | null {
  try {
    const key = thinkingProfileStorageKey(learnerId);
    const raw = window.localStorage.getItem(key);
    const cached = profileCache.get(key);
    if (cached?.raw === raw) return cached.value;
    const value = raw ? (JSON.parse(raw) as ThinkingProfile) : null;
    profileCache.set(key, { raw, value });
    return value;
  } catch {
    return null;
  }
}

export function DashboardThinkingProfile({
  learnerName,
  learnerId,
}: {
  learnerName: string;
  learnerId: string;
}) {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }, []);
  const getSnapshot = useCallback(() => readProfile(learnerId), [learnerId]);
  const profile = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null,
  );

  if (!profile) {
    return (
      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(255,246,230,0.95))] shadow-[0_22px_55px_rgba(23,23,23,0.09),0_4px_14px_rgba(23,23,23,0.05)]">
        <div className={heroGrid}>
          <div className="flex flex-col">
            <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
              Your thinking profile
            </p>
            <h1 className={heroHeading}>
              Your pattern is
              <br />
              <span className="font-semibold">waiting to emerge.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink/70">
              Finish a story, {learnerName}, and Artham will turn the small
              choices you made into a clear, descriptive read on how you think.
            </p>
            <div className="mt-auto pt-7">
              <Link
                href="/explore"
                className="inline-flex w-fit items-center rounded-full bg-primary px-5 py-3 text-[14px] font-bold text-primary-ink shadow-[0_4px_0_var(--press),0_10px_22px_rgba(23,23,23,0.18)] transition hover:-translate-y-0.5"
              >
                Start your first story →
              </Link>
            </div>
          </div>

          {/* Mirrors the filled state's panel so the card keeps one shape in
              both states, and previews exactly which signals get collected. */}
          <div className={heroPanel}>
            <p className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
              What Artham watches
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full w-0 rounded-full bg-accent" />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <ProfileStat label="Decisions" value="—" />
              <ProfileStat label="Revisions" value="—" />
              <ProfileStat label="First tries" value="—" />
              <ProfileStat label="Hints" value="—" />
            </dl>
          </div>
        </div>
      </section>
    );
  }

  const signal = Math.max(0, Math.min(100, profile.score));

  return (
    <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,251,247,0.96)_52%,rgba(255,246,230,0.94))] shadow-[0_22px_55px_rgba(23,23,23,0.09),0_4px_14px_rgba(23,23,23,0.05)]">
      <div className={heroGrid}>
        <div className="flex flex-col">
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
            Your thinking profile
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/12 text-2xl shadow-[0_3px_0_rgb(var(--accent-rgb)/0.2)]"
            >
              🧠
            </span>
            <h1 className="text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] font-light tracking-tight text-ink">
              {profile.archetype}
            </h1>
          </div>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink/75 sm:text-[17px]">
            {profile.summary}
          </p>
          <div className="mt-auto grid gap-3 pt-7 sm:grid-cols-2">
            <ProfilePill
              label="Strength"
              value={profile.strength.evidence}
              tone="sage"
            />
            <ProfilePill
              label="To improve"
              value={profile.blindSpot.evidence}
              tone="accent"
            />
          </div>
        </div>

        <div className={heroPanel}>
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
              Profile signal
            </p>
            <p className="text-2xl font-semibold tracking-tight text-ink">
              {signal}%
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700"
              style={{ width: `${signal}%` }}
            />
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3">
            <ProfileStat label="Decisions" value={profile.stats.decisions} />
            <ProfileStat
              label="Revisions"
              value={profile.stats.selfCorrections}
            />
            <ProfileStat
              label="First tries"
              value={profile.stats.firstTryCorrect}
            />
            <ProfileStat label="Hints" value={profile.stats.hintsUsed} />
          </dl>
        </div>
      </div>
    </section>
  );
}

function ProfilePill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "sage" | "accent";
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl px-4 py-3 ${
        tone === "sage" ? "bg-sage/12" : "bg-accent/10"
      }`}
    >
      <p className="text-[10px] font-bold tracking-[0.15em] text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink/80">{value}</p>
    </div>
  );
}

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <dt className="text-xl font-semibold tracking-tight text-ink">{value}</dt>
      <dd className="mt-0.5 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
        {label}
      </dd>
    </div>
  );
}
