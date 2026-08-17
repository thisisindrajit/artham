import type { SceneVisualKind } from "./types";

const SCENE_EMOJI: Record<SceneVisualKind, string> = {
  bridge: "🌉",
  scan: "📈",
  resonance: "🎵",
  weights: "⚖️",
  storm: "⛈️",
  dawn: "🌅",
  reactor: "⚗️",
  reaction: "🔥",
  cooling: "❄️",
  vent: "🌬️",
  "plant-dawn": "🌅",
  city: "🏙️",
  market: "🏠",
  queue: "🧍",
  council: "🏛️",
  "city-dawn": "🌇",
  lab: "🧬",
  evidence: "🔬",
  sequencer: "🧬",
  interview: "🗣️",
  "lab-dawn": "🌅",
  walls: "🏰",
  horse: "🐴",
  assembly: "🏛️",
  shore: "⛵",
  "troy-dawn": "🌅",
};

export function storyEmoji(kind: SceneVisualKind): string {
  return SCENE_EMOJI[kind];
}
