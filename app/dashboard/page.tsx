import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { DashboardThinkingProfile } from "@/components/dashboard-thinking-profile";
import { PaperBackdrop } from "@/components/paper-backdrop";
import { StoryGrid } from "@/components/story-grid";
import { getGeneratedScenarios } from "@/lib/generated-story-adapter";
import { getSession } from "@/lib/session";
import { pageShell } from "@/constants/ui";

export default async function DashboardPage() {
  const [session, scenarios] = await Promise.all([
    getSession(),
    getGeneratedScenarios(),
  ]);

  if (!session) {
    redirect("/sign-in?callbackURL=/dashboard");
  }

  // Three, not four: the grid tops out at three columns, so a fourth card
  // would always hang alone on a second row.
  const featured = scenarios.slice(0, 3);
  const learnerName = session.user.name?.split(" ")[0] || "there";

  return (
    <div
      data-mood="welcome"
      className="relative isolate flex min-h-dvh flex-col"
    >
      <PaperBackdrop />
      <AppHeader user={session.user} />

      <main className={`${pageShell} flex-1 py-10 sm:py-12`}>
        <div className="animate-rise motion-reduce:animate-none">
          <DashboardThinkingProfile
            learnerName={learnerName}
            learnerId={session.user.id || session.user.email}
          />
        </div>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.17em] text-muted uppercase">
                Keep exploring
              </p>
              <h2 className="mt-1 text-[28px] font-semibold tracking-tight text-ink">
                Recommended stories
              </h2>
            </div>
            <div>
              <Link
                href="/explore"
                className="shrink-0 rounded-full border border-ink/15 bg-white/90 px-4 py-2 text-[13px] font-bold text-ink shadow-[0_3px_0_rgba(23,23,23,0.08)] transition hover:-translate-y-0.5 hover:border-ink/30"
              >
                Explore all →
              </Link>
              <Link
                href="/create"
                className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white shadow-[0_3px_0_rgba(23,23,23,0.12)] transition hover:-translate-y-0.5"
              >
                Create story
              </Link>
            </div>
          </div>

          {featured.length > 0 ? (
            <StoryGrid
              scenarios={featured}
              isAuthenticated
              showShortcutHints={false}
            />
          ) : (
            <EmptyState />
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-ink/25 bg-white/60 px-6 py-10 text-[15px] leading-relaxed text-ink/70">
      No generated stories are published yet. Generate one from the ADK pipeline
      and it will appear here.
    </div>
  );
}
