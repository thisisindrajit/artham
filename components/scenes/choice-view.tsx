import { StorySimulation } from "../story-simulation";
import {
  cardInteractive,
  cardSoft,
  storyIndex,
  storyOption,
  storyTag,
} from "@/constants/ui";
import type { ChoiceScene } from "@/lib/story";
import { HelpButton } from "./controls";
import { Narration, PrimerCard, StoryCopy, TriviaCard } from "./shared";

export function ChoiceView({
  scene,
  tried,
  busy,
  onChoose,
  onHelp,
  onPreview,
}: {
  scene: ChoiceScene;
  tried: string[];
  busy: boolean;
  onChoose: (optionId: string) => void;
  onHelp: () => void;
  onPreview: (message: string | null) => void;
}) {
  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && (
        <TriviaCard trivia={scene.trivia} delay={scene.text.length * 110} />
      )}
      {scene.primer && (
        <PrimerCard primer={scene.primer} delay={scene.text.length * 110} />
      )}
      {scene.simulation && (
        <StorySimulation kind={scene.simulation} guide={scene.simGuide} />
      )}

      <div className="space-y-3">
        <span className={`${storyTag} animate-rise inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic motion-reduce:animate-none`}>
          <span aria-hidden className="mr-1.5 not-italic">🎯</span>
          Your move
        </span>
        <h2 className="animate-rise text-[21px] font-bold tracking-tight text-ink motion-reduce:animate-none">
          <StoryCopy text={scene.prompt} />
        </h2>
        <div className="grid gap-2.5">
          {scene.options.map((option, i) => {
            const spent = tried.includes(option.id);
            return (
              <button
                key={option.id}
                disabled={spent || busy}
                onClick={() => onChoose(option.id)}
                onMouseEnter={() =>
                  onPreview(
                    option.detail
                      ? `${option.label} — ${option.detail}`
                      : option.label,
                  )
                }
                onMouseLeave={() => onPreview(null)}
                onFocus={() =>
                  onPreview(
                    option.detail
                      ? `${option.label} — ${option.detail}`
                      : option.label,
                  )
                }
                onBlur={() => onPreview(null)}
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
