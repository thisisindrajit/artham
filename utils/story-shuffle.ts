import type { ChoiceOption, ReorderScene } from "@/types/story";

/**
 * Deterministic shuffle for reorder scenes. Server and client must agree, so
 * the seed is the scene id and never `Math.random`.
 */
export function shuffledStepIds(scene: ReorderScene): string[] {
  return seededShuffle(
    scene.steps.map((step) => step.id),
    scene.id,
  );
}

export function shuffledChoiceOptions(
  sceneId: string,
  options: ChoiceOption[],
): ChoiceOption[] {
  return seededShuffle(options, `${sceneId}:choices`);
}

function seededShuffle<T>(values: T[], seed: string): T[] {
  const shuffled = [...values];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
