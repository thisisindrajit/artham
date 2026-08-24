import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PaperBackdrop } from "@/components/paper-backdrop";
import { ScenarioPicker } from "@/components/scenario-picker";
import { getGeneratedScenarios } from "@/lib/generated-story-adapter";
import { getSession } from "@/lib/session";
import { pageShell, sticker } from "@/constants/ui";

export default async function ExplorePage() {
  const [session, scenarios] = await Promise.all([
    getSession(),
    getGeneratedScenarios(),
  ]);

  if (!session) {
    redirect("/sign-in?callbackURL=/explore");
  }

  return (
    <div
      data-mood="welcome"
      className="relative isolate flex min-h-dvh flex-col"
    >
      <PaperBackdrop />
      <AppHeader user={session.user} />

      <main className={`${pageShell} flex-1 py-10 sm:py-12`}>
        <section className="animate-rise max-w-3xl space-y-4 motion-reduce:animate-none">
          <span
            className={`${sticker} inline-flex rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-primary-ink shadow-[0_3px_0_var(--press)]`}
          >
            Explore
          </span>
          <h1 className="text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-light tracking-tight text-ink">
            All Artham stories.
          </h1>
          <p className="max-w-2xl text-[16px] leading-relaxed text-ink/72 sm:text-[17px]">
            Browse every generated story across subjects. Story artwork loads
            chapter by chapter as you progress.
          </p>
        </section>

        <section
          className="animate-rise mt-9 motion-reduce:animate-none"
          style={{ animationDelay: "140ms" }}
        >
          <ScenarioPicker scenarios={scenarios} isAuthenticated />
        </section>
      </main>
    </div>
  );
}
