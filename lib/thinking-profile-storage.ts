export function thinkingProfileStorageKey(learnerId: string): string {
  return `artham:thinking-profile:${encodeURIComponent(learnerId)}`;
}
