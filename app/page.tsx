import { scenarios } from "@/lib/story";
import { ScenarioPicker } from "@/components/scenario-picker";
import { PaperBackdrop } from "@/components/paper-backdrop";
import { ArthamMark } from "@/components/artham-mark";
import { capMarker, sticker } from "@/lib/ui";

export default function Home() {
  return (
    <div
      data-mood="welcome"
      className="relative isolate flex min-h-dvh flex-col px-4 sm:px-6"
    >
      <PaperBackdrop />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-12 sm:py-16 lg:py-20">
        <div className="rise space-y-5 sm:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <ArthamMark
              size={36}
              priority
            />
            <p className={`${sticker} rainbow-pill inline-flex items-center rounded-full px-3.5 py-2 text-[12px] leading-none font-semibold tracking-[0.05em] text-ink shadow-[0_3px_0_rgba(23,23,23,0.1)] sm:px-4 sm:text-[13px]`}>
              Artham · stories for curious minds
            </p>
          </div>
          {/* pb reserves room for the wavy underline, which is painted outside
              the h1's box and otherwise crowds the paragraph. */}
          <h1 className="pb-1 text-[clamp(2.5rem,6.4vw,3.5rem)] leading-[1.28] font-light tracking-tight text-ink sm:pb-2 sm:leading-[1.2]">
            Solve the <span className="font-semibold">story</span>.
            <br />
            <span className="font-semibold underline decoration-dotted decoration-pop [text-decoration-skip-ink:none] underline-offset-[8px]">
              See how you think.
            </span>
          </h1>
          <p className="max-w-xl text-[16px] leading-relaxed text-ink/75 sm:text-[17px]">
            Step into a situation. Try something, change your mind, work it out.
            Artham follows the reasoning behind your moves — not whether you got
            it right — and shows you how you think.
          </p>
        </div>

        <div
          className="rise mt-10 space-y-4 sm:mt-12 lg:mt-14"
          style={{ animationDelay: "180ms" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span
              className={`${sticker} inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[14px] leading-none font-semibold text-primary-ink shadow-[0_3px_0_var(--press)]`}
            >
              <span aria-hidden>▸</span>
              Pick your situation
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1 text-[13px] font-medium tracking-[0.12em] text-muted uppercase">
              <span
                aria-hidden
                className={`${capMarker} story-live-dot size-1.5 rounded-full bg-ink`}
              />
              {scenarios.length} playable
            </span>
          </div>
          <ScenarioPicker scenarios={scenarios} />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-3xl pb-6 text-[13px] text-ink/70 sm:pb-8 sm:text-[14px]">
        <span className="font-semibold text-ink">No grades.</span> Just your
        reasoning, read back to you.
      </footer>
    </div>
  );
}
