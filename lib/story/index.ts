import { coldCase } from "./scenarios/cold-case";
import { rentCrisis } from "./scenarios/rent-crisis";
import { resonanceBridge } from "./scenarios/resonance-bridge";
import { runawayReactor } from "./scenarios/runaway-reactor";
import { trojanHorse } from "./scenarios/trojan-horse";
import type { Scenario, Scene } from "./types";

/** Order controls how they appear on the landing page. */
export const scenarios: Scenario[] = [
  resonanceBridge,
  runawayReactor,
  coldCase,
  rentCrisis,
  trojanHorse,
];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export function getScene(scenario: Scenario, sceneId: string): Scene {
  const scene = scenario.scenes.find((s) => s.id === sceneId);
  if (!scene) {
    throw new Error(
      `Scenario "${scenario.id}" has no scene "${sceneId}". Story data is broken.`,
    );
  }
  return scene;
}

export * from "./types";
