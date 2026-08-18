import type {
  Domain,
  Scenario,
  SceneVisualKind,
} from "@/types/story";

export const DIFFICULTY_PIPS: Record<Scenario["difficulty"], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const SCENE_EMOJI: Record<SceneVisualKind, string> = {
  bridge: "🌉",
  scan: "📈",
  resonance: "〰️",
  weights: "⚙️",
  storm: "⛈️",
  dawn: "🌅",
  reactor: "⚗️",
  reaction: "🌡️",
  cooling: "❄️",
  vent: "💨",
  "plant-dawn": "🌤️",
  city: "🏙️",
  market: "📊",
  queue: "🚶",
  council: "🏛️",
  "city-dawn": "🏗️",
  lab: "🧬",
  evidence: "🔬",
  sequencer: "🧪",
  interview: "🗂️",
  "lab-dawn": "☀️",
  walls: "🏰",
  horse: "🐴",
  assembly: "📜",
  shore: "⛵",
  "troy-dawn": "🌄",
};

export const DOMAIN_ORDER: Domain[] = [
  "physics",
  "chemistry",
  "biology",
  "economics",
  "history",
];

export const STORY_PARTS =
  /(“[^”]+”|\$?[\d][\d,.]*(?:\s?(?:a\.m\.|p\.m\.|Hz|°C|t|L|k|%)(?!\p{L}))?)/gu;

export const RECENT_STORY_BEATS_ON_SMALL_SCREENS = 3;
