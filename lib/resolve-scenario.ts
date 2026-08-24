import "server-only";

import { generatedStoryToScenario } from "@/lib/generated-story-adapter";
import { getGeneratedStory } from "@/lib/generated-story";
import type { Scenario } from "@/types/story";

export async function resolveScenario(id: string): Promise<Scenario | null> {
  try {
    return generatedStoryToScenario(await getGeneratedStory(id));
  } catch {
    return null;
  }
}
