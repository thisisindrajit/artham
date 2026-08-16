import Image from "next/image";
import mark from "@/public/artham-mark.png";

/**
 * The Artham mark: the Tamil letter அ ("a", as in *artham* — meaning, reason)
 * drawn as one continuous glossy stroke.
 *
 * It is the single place the brand's full spectrum is allowed. Everywhere else
 * colour still means exactly one of two things — which subject you are in, or
 * how a decision went — so the mark deliberately sits outside that system,
 * the same way `--color-pop` does.
 *
 * `priority` is off by default: the mark is small and never the LCP element
 * except in the hero, which passes it explicitly.
 *
 * Sizing is by width only, with `h-auto` baked in so the artwork keeps its
 * 4:3 ratio. Note that `height: auto` is exactly the condition under which a
 * flex parent's default `align-items: stretch` squashes it, so any flex row
 * holding the mark must set its own cross-axis alignment.
 */
export function ArthamMark({
  className = "",
  size = 32,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src={mark}
      alt=""
      aria-hidden
      width={size}
      height={Math.round((size * 480) / 640)}
      priority={priority}
      className={`h-auto shrink-0 select-none ${className}`}
    />
  );
}
