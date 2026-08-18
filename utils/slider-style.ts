import type { SliderScene } from "@/types/story";

export function sliderTrackGradient(scene: SliderScene): string {
  const span = scene.slider.max - scene.slider.min;
  const limit = ((scene.target.max - scene.slider.min) / span) * 100;
  return `linear-gradient(90deg, rgba(23,23,23,0.18) 0%, rgba(23,23,23,0.18) ${limit}%, rgba(179,38,30,0.5) ${limit}%)`;
}
