import { useState } from "react";
import type React from "react";
import { cardSoft, rangeInput, storyOption, storyTag } from "@/constants/ui";
import type { SliderScene } from "@/lib/story";
import { readoutFor, sliderRisk } from "@/utils/engine-formulas";
import { sliderTrackGradient } from "@/utils/slider-style";
import { HelpButton, PrimaryButton } from "./controls";
import { Narration, PrimerCard, StoryCopy, TriviaCard } from "./shared";
import { Metric, SliderMeter } from "./slider-meter";

export function SliderView({
  scene,
  busy,
  onCommit,
  onHelp,
  onPreview,
}: {
  scene: SliderScene;
  busy: boolean;
  onCommit: (value: number) => void;
  onHelp: () => void;
  onPreview: (message: string | null) => void;
}) {
  const [value, setValue] = useState(scene.slider.initial);

  // Reset to the scene's starting value when the scene changes.
  const [lastSceneId, setLastSceneId] = useState(scene.id);
  if (scene.id !== lastSceneId) {
    setLastSceneId(scene.id);
    setValue(scene.slider.initial);
  }

  const readout = readoutFor(scene, value);
  const risk = sliderRisk(scene, value);
  const gap =
    scene.risk.mode === "separation"
      ? Math.abs(readout - scene.driver.value)
      : scene.driver.value - readout;
  const gapLabel = scene.risk.mode === "separation" ? "Separation" : "Headroom";
  const gapSafe =
    scene.risk.mode === "separation" ? gap >= scene.risk.safeGap : gap > 0;

  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && (
        <TriviaCard trivia={scene.trivia} delay={scene.text.length * 110} />
      )}
      {scene.primer && (
        <PrimerCard primer={scene.primer} delay={scene.text.length * 110} />
      )}

      <div className={`${cardSoft} ${storyOption} animate-rise overflow-hidden rounded-2xl motion-reduce:animate-none`}>
        <SliderMeter scene={scene} risk={risk} readout={readout} />

        <div className="grid grid-cols-3 border-t border-line">
          <Metric
            label={scene.readout.label}
            value={readout.toFixed(scene.readout.decimals)}
            unit={scene.readout.unit}
            tone={risk > 0.72 ? "rose" : risk > 0.38 ? "accent" : "sage"}
          />
          <Metric
            label={scene.driver.label}
            value={scene.driver.value.toFixed(scene.readout.decimals)}
            unit={scene.driver.unit}
            tone="muted"
          />
          <Metric
            label={gapLabel}
            value={gap.toFixed(scene.readout.decimals)}
            unit={scene.driver.unit}
            tone={gapSafe ? "sage" : "rose"}
          />
        </div>

        <div className="space-y-2 px-5 pt-4 pb-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] tracking-[0.16em] text-muted uppercase">
              {scene.slider.label}
            </span>
            <span className={`font-mono tabular-nums text-[28px] font-light text-ink`}>
              {value}
              <span className="ml-1 text-[16px] text-muted">
                {scene.slider.unit}
              </span>
            </span>
          </div>
          <input
            type="range"
            className={rangeInput}
            style={
              {
                "--track": sliderTrackGradient(scene),
              } as React.CSSProperties
            }
            min={scene.slider.min}
            max={scene.slider.max}
            step={scene.slider.step}
            value={value}
            disabled={busy}
            onChange={(e) => {
              const nextValue = Number(e.target.value);
              setValue(nextValue);
              onPreview(
                `Trying ${nextValue}${scene.slider.unit} — ${scene.readout.label.toLowerCase()} ${readoutFor(
                  scene,
                  nextValue,
                ).toFixed(scene.readout.decimals)}${scene.readout.unit}`,
              );
            }}
          />
          <div className="flex justify-between text-[13px] text-faint">
            <span>
              {scene.slider.min}
              {scene.slider.unit}
            </span>
            <span>
              {scene.slider.max}
              {scene.slider.unit}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <span className={`${storyTag} inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic`}>
          <span aria-hidden className="mr-1.5 not-italic">🎛️</span>
          Tune it
        </span>
        <h2 className="text-[21px] font-bold tracking-tight text-ink">
          <StoryCopy text={scene.prompt} />
        </h2>
        <PrimaryButton
          onClick={() => onCommit(value)}
          label={`Set ${value}${scene.slider.unit}`}
          disabled={busy}
        />
      </div>

      <HelpButton onClick={onHelp} busy={busy} />
    </div>
  );
}
