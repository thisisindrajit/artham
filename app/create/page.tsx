import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PaperBackdrop } from "@/components/paper-backdrop";
import { StoryCreationForm } from "@/components/story-creation-form";
import { pageShell } from "@/constants/ui";
import { getGeneratedScenarios } from "@/lib/generated-story-adapter";
import { getSession } from "@/lib/session";

export default async function CreateStoryPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?callbackURL=/create");

  const scenarios = await getGeneratedScenarios();
  const subjects = scenarios.map((scenario) => scenario.domain);

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <PaperBackdrop />
      <AppHeader user={session.user} />
      <main className={`${pageShell} flex-1 py-10 sm:py-14`}>
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.17em] text-muted uppercase">Story studio</p>
          <h1 className="mt-2 text-[clamp(2.2rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-tight text-ink">
            Make a story to learn.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">
            Choose the subject, name the exact topic, and decide which media should bring it to life.
          </p>
          <section className="mt-9 rounded-[2rem] border border-ink/10 bg-white/80 p-5 shadow-[0_12px_40px_rgba(111,56,17,0.08)] sm:p-8">
            <StoryCreationForm subjects={subjects} />
          </section>
        </div>
      </main>
    </div>
  );
}
