import type { Scenario, Scene } from "@/types/story";

export function getScene(scenario: Scenario, sceneId: string): Scene {
  const scene = scenario.scenes.find((candidate) => candidate.id === sceneId);
  if (!scene) {
    throw new Error(
      `Scenario "${scenario.id}" has no scene "${sceneId}". Story data is broken.`,
    );
  }
  return scene;
}
