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

export const DOMAIN_LABELS: Record<Domain, string> = {
  math: "Math",
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  economics: "Economics",
  history: "History",
  space: "Space",
  "computer-science": "Computer Science",
  geography: "Geography",
  technology: "Technology",
};

export const SCENE_EMOJI: Record<SceneVisualKind, string> = {
  generated: "🖼️",
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
  "math",
  "physics",
  "chemistry",
  "biology",
  "economics",
  "history",
  "space",
  "computer-science",
  "geography",
  "technology",
];

export const STORY_PARTS =
  /(“[^”]+”|"[^"\n]+"|\$?[\d][\d,.]*(?:\s?(?:a\.m\.|p\.m\.|Hz|°C|t|L|k|%)(?!\p{L}))?)/gu;
