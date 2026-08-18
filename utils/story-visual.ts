import { SCENE_EMOJI } from "@/constants/story";
import type { SceneVisualKind } from "@/types/story";

export function storyEmoji(kind: SceneVisualKind): string {
  return SCENE_EMOJI[kind];
}
