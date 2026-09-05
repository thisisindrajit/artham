import type { SliderScene } from "@/types/story";

export function sliderTrackGradient(scene: SliderScene): string {
  const span = scene.slider.max - scene.slider.min;
  const start = ((scene.target.min - scene.slider.min) / span) * 100;
  const end = ((scene.target.max - scene.slider.min) / span) * 100;
  return `linear-gradient(90deg, rgb(var(--color-rose-rgb) / 0.45) 0%, rgb(var(--color-rose-rgb) / 0.45) ${start}%, rgb(var(--color-sage-rgb) / 0.65) ${start}%, rgb(var(--color-sage-rgb) / 0.65) ${end}%, rgb(var(--color-rose-rgb) / 0.45) ${end}%)`;
}
