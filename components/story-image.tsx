import Image from "next/image";
import type { StoryImageProps } from "@/types/components";
import { storyEmoji } from "@/utils/story-visual";

/**
 * The picture at the top of a beat.
 *
 * This slot used to hold a live SVG diagram of the scene. It was the wrong
 * thing in the wrong place: it competed with the simulation for the learner's
 * attention while teaching nothing the prose did not already say, and it sat in
 * a fixed column that never scrolled with the story it was illustrating.
 *
 * So the slot is now an ordinary illustration slot. Real artwork is generated
 * later; until it lands the frame paints a subject-coloured tile — the domain
 * accent, the same 22px paper grid as the page, and the beat's icon — so the
 * page reads as finished today and a picture can drop in without the layout
 * moving. The caption strip carries what the picture is of, which is also the
 * brief for whoever draws it.
 */
export function StoryImage({ visual, priority = false }: StoryImageProps) {
  return (
    <figure className="animate-rise overflow-hidden rounded-2xl border border-ink/10 bg-white/90 shadow-[0_3px_0_rgba(23,23,23,0.06),0_14px_34px_rgba(23,23,23,0.07)] motion-reduce:animate-none">
      <div className="relative aspect-video w-full overflow-hidden bg-accent/8">
        {visual.src ? (
          <Image
            src={visual.src}
            alt={`${visual.title}. ${visual.caption}`}
            fill
            priority={priority}
            unoptimized
            sizes="(max-width: 1024px) 100vw, 720px"
            className="object-cover"
          />
        ) : (
          <PlaceholderTile kind={visual.kind} />
        )}
      </div>

      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line px-5 py-3.5">
        <span className="text-[12px] font-bold tracking-[0.16em] text-ink/60 uppercase">
          {visual.title}
        </span>
        <span className="text-[12.5px] text-faint">{visual.status}</span>
        <span className="w-full text-[15px] leading-[1.55] text-ink/75">
          {visual.caption}
        </span>
      </figcaption>
    </figure>
  );
}

function PlaceholderTile({ kind }: { kind: StoryImageProps["visual"]["kind"] }) {
  return (
    /* aria-hidden: the caption strip below already states everything the tile
       stands for, so announcing it here would only repeat the beat twice. */
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_20%_0%,rgb(var(--accent-rgb)/0.26)_0%,rgb(var(--accent-rgb)/0.07)_45%,transparent_78%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(23,23,23,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(23,23,23,0.045)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid size-20 place-items-center rounded-[1.35rem] border border-ink/10 bg-white/85 text-[38px] shadow-[0_4px_0_rgb(var(--accent-rgb)/0.18),0_12px_28px_rgba(23,23,23,0.08)] sm:size-24 sm:text-[46px]">
          {storyEmoji(kind)}
        </span>
      </div>
    </div>
  );
}
