import Link from "next/link";
import { currentScene } from "@/lib/engine";
import type { SessionRailProps } from "@/types/components";
import { ArthamMark } from "@/components/artham-mark";

export function SessionRail({ scenario, state }: SessionRailProps) {
  const scene = currentScene(state);
  const index = scenario.scenes.findIndex((candidate) => candidate.id === scene.id);
  const progress =
    state.phase === "scene" ? ((index + 1) / scenario.scenes.length) * 100 : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/80 shadow-[0_4px_18px_rgba(111,56,17,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center gap-2 text-[13px] tracking-[0.22em] text-faint uppercase transition hover:text-muted"
        >
          <ArthamMark
            size={32}
            className="w-[28px] transition-transform duration-300 ease-[var(--ease-bounce)] group-hover:-rotate-12 group-hover:scale-110"
          />
        </Link>
        {state.phase === "scene" && (
          <span className="min-w-0 truncate text-[13px] tracking-[0.16em] text-faint uppercase">
            Chapter {scene.act} · {scene.beat}
          </span>
        )}
      </div>
      <div className="h-1 w-full bg-accent/12">
        <div
          className="h-1 rounded-r-full bg-accent transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
