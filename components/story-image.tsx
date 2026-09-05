import Image from "next/image";
import type { StoryImageProps } from "@/types/components";

export function StoryImage({ visual, priority = false }: StoryImageProps) {
  if (!visual.src) return null;

  return (
    <figure className="animate-rise overflow-hidden rounded-2xl border border-ink/10 bg-white/90 shadow-[0_3px_0_rgba(23,23,23,0.06),0_14px_34px_rgba(23,23,23,0.07)] motion-reduce:animate-none">
      <div className="relative aspect-video w-full overflow-hidden bg-accent/8">
        <Image
          src={visual.src}
          alt={`${visual.title}. ${visual.caption}`}
          fill
          priority={priority}
          unoptimized
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover"
        />
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
