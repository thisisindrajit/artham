import type { Mood, SceneVisual } from "@/lib/story";
import { storyEmoji } from "@/utils/story-visual";
import { capMarker, storyStageTheme } from "@/constants/ui";
import { StageGraphic } from "./stage-graphic";

export function StoryStage({
  visual,
  mood,
  label,
  preview,
  result,
}: {
  visual: SceneVisual;
  mood: Mood;
  /** Ticker text, e.g. "Aetherfall live". Comes from the scenario. */
  label: string;
  preview: string | null;
  result: "success" | "warning" | null;
}) {
  const status =
    result === "success"
      ? "that worked"
      : result === "warning"
        ? "things just changed"
        : visual.status;

  return (
    <aside
      data-art-slot={visual.kind}
      aria-label={`${visual.title}. ${preview ?? visual.caption}`}
      className={`${storyStageTheme} animate-rise group relative h-[21rem] overflow-hidden rounded-[28px] border bg-black/20 shadow-[0_24px_60px_rgba(90,42,10,0.18)] transition motion-reduce:animate-none sm:h-96 md:h-[27rem] ${
        preview ? "border-accent/45" : "border-white/15"
      } lg:h-auto lg:aspect-[4/5] lg:shrink-0`}
    >
      <StageGraphic kind={visual.kind} mood={mood} status={visual.status} />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-5">
        <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[12px] leading-none tracking-[0.14em] text-ink/70 uppercase backdrop-blur-md">
          <span
            className={`${capMarker} animate-story-live-dot size-1.5 rounded-full bg-accent shadow-[0_0_0_0_rgb(var(--accent-rgb)/0.5)] motion-reduce:animate-none`}
          />
          <span aria-hidden className="text-[13px] tracking-normal">
            {storyEmoji(visual.kind)}
          </span>
          {label}
        </span>
        <span className="rounded-full border border-white/10 bg-black/35 px-3 py-2 text-right text-[12px] leading-none text-ink/60 backdrop-blur-md">
          {status}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="rounded-2xl border border-white/10 bg-[#100b08]/78 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={`${capMarker} mt-1.5 size-2 shrink-0 rounded-full bg-accent`}
            />
            <div
              key={preview ?? visual.caption}
              className="animate-stage-copy min-w-0 motion-reduce:animate-none"
            >
              <p className="text-[13px] tracking-[0.14em] text-ink/60 uppercase">
                {preview ? "What if…" : visual.title}
              </p>
              <p className="mt-1 text-[15.5px] leading-relaxed text-ink/85">
                {preview ?? visual.caption}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
