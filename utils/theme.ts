import type { Mood } from "@/types/story";

export function moodInk(mood: Mood): string {
  if (mood === "alarm") return "var(--color-rose)";
  if (mood === "insight") return "var(--color-accent)";
  return "var(--color-ink)";
}
