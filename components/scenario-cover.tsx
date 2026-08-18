import Image from "next/image";
import type { ScenarioCoverProps } from "@/types/components";
import { storyEmoji } from "@/utils/story-visual";

/**
 * The cover slot on a picker card.
 *
 * Real artwork is generated later, so most stories have no `art.src` yet. The
 * fallback is deliberately *not* a dashed grey box: an empty-looking hole reads
 * as a broken build, and the picker is the first thing anyone sees. Instead the
 * slot paints a subject-coloured tile — the domain accent, the paper grid the
 * rest of the app uses, and the story's own opening icon — so the page looks
 * finished today and the tile can be swapped for a picture without the layout
 * moving a pixel.
 */
export function ScenarioCover({ scenario }: ScenarioCoverProps) {
  const { art } = scenario;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-ink/10 bg-accent/8">
      {art.src ? (
        <Image
          src={art.src}
          alt={art.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <PlaceholderTile scenario={scenario} />
      )}
    </div>
  );
}

function PlaceholderTile({ scenario }: ScenarioCoverProps) {
  const emoji = scenario.art.emoji ?? storyEmoji(scenario.intro.visual.kind);

  return (
    /* aria-hidden: the tile carries no information the card does not already
       state in text, so announcing the art brief here would only make a screen
       reader repeat the title twice. */
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_20%_0%,rgb(var(--accent-rgb)/0.28)_0%,rgb(var(--accent-rgb)/0.08)_45%,transparent_78%)]" />
      {/* Same 22px paper grid as the page backdrop, so a card without art still
          reads as part of the same sheet rather than a foreign swatch. */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(23,23,23,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(23,23,23,0.05)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid size-20 place-items-center rounded-[1.35rem] border border-ink/10 bg-white/80 text-[38px] shadow-[0_4px_0_rgb(var(--accent-rgb)/0.18),0_12px_28px_rgba(23,23,23,0.08)] transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:-rotate-6 group-hover:scale-110 sm:size-24 sm:text-[46px]">
          {emoji}
        </span>
      </div>
    </div>
  );
}
