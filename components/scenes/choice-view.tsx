import { useMemo } from "react";
import {
  cardInteractive,
  cardSoft,
  storyIndex,
  storyOption,
  storyTag,
} from "@/constants/ui";
import type { ChoiceScene } from "@/lib/story";
import { shuffledChoiceOptions } from "@/utils/story-shuffle";
import { HelpButton } from "./controls";
import { StoryCopy } from "./shared";

export function ChoiceControls({
  scene,
  tried,
  busy,
  onChoose,
  onHelp,
}: {
  scene: ChoiceScene;
  tried: string[];
  busy: boolean;
  onChoose: (optionId: string) => void;
  onHelp: () => void;
}) {
  const options = useMemo(
    () => shuffledChoiceOptions(scene.id, scene.options),
    [scene.id, scene.options],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className={`${storyTag} animate-rise inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic motion-reduce:animate-none`}>
          <span aria-hidden className="mr-1.5 not-italic">🎯</span>
          Your move
        </span>
        <h2 className="animate-rise text-[21px] font-bold tracking-tight text-ink motion-reduce:animate-none">
          <StoryCopy text={scene.prompt} />
        </h2>
        <div className="grid gap-2.5">
          {options.map((option, i) => {
            const spent = tried.includes(option.id);
            return (
              <button
                key={option.id}
                disabled={spent || busy}
                onClick={() => onChoose(option.id)}
                className={`${cardSoft} ${cardInteractive} ${storyOption} animate-rise group rounded-2xl px-4 py-3.5 text-left motion-reduce:animate-none ${
                  spent
                    ? "cursor-not-allowed opacity-35"
                    : "active:scale-[0.995]"
                }`}
                style={{ animationDelay: `${180 + i * 70}ms` }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`${storyIndex} grid size-8 shrink-0 place-items-center rounded-full text-[15px] font-extrabold italic transition group-hover:-rotate-6 group-hover:scale-105`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[16px] font-semibold text-ink">
                    <StoryCopy text={option.label} />
                  </span>
                  {spent && (
                    <span className="text-[12px] tracking-wider text-faint uppercase">
                      already tried
                    </span>
                  )}
                </span>
                {option.detail && (
                  <span className="mt-1 block pl-10 text-[15.5px] leading-relaxed text-muted">
                    <StoryCopy text={option.detail} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <HelpButton onClick={onHelp} busy={busy} />
    </div>
  );
}
