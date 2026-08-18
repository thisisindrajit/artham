import type { StageFamily } from "@/types/components";
import type { SceneVisualKind } from "@/types/story";

export const VISUAL_FAMILY: Record<SceneVisualKind, StageFamily> = {
  bridge: "bridge",
  scan: "bridge",
  resonance: "bridge",
  weights: "bridge",
  storm: "bridge",
  dawn: "bridge",
  reactor: "reactor",
  reaction: "reactor",
  cooling: "reactor",
  vent: "reactor",
  "plant-dawn": "reactor",
  city: "city",
  market: "city",
  queue: "city",
  council: "city",
  "city-dawn": "city",
  lab: "lab",
  evidence: "lab",
  sequencer: "lab",
  interview: "lab",
  "lab-dawn": "lab",
  walls: "troy",
  horse: "troy",
  assembly: "troy",
  shore: "troy",
  "troy-dawn": "troy",
};

export const DAWN_VISUALS: SceneVisualKind[] = [
  "dawn",
  "plant-dawn",
  "city-dawn",
  "lab-dawn",
  "troy-dawn",
];
