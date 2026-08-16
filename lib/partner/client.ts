import "server-only";

import type { EngineEvent } from "../engine";
import { fallbackObserve, fallbackPrelude, fallbackProfile } from "./fallbacks";
import type {
  ObserveRequest,
  ObserveResponse,
  PreludeRequest,
  PreludeResponse,
  ProfileRequest,
  ThinkingProfile,
} from "./types";

/**
 * Server-side client for the ADK partner service.
 *
 * Every method resolves. A failure here degrades the partner, it never breaks
 * the story — that guarantee is the whole reason the story engine is
 * deterministic in the first place.
 */

const BASE_URL = process.env.PARTNER_URL ?? "http://127.0.0.1:8080";

async function post<T>(
  path: string,
  body: unknown,
  timeoutMs: number,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[partner] ${path} responded ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`[partner] ${path} unreachable:`, (error as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function requestPrelude(
  req: PreludeRequest,
): Promise<PreludeResponse> {
  const result = await post<Omit<PreludeResponse, "fallback">>(
    "/prelude",
    req,
    20_000,
  );
  if (!result?.question?.options?.length) return fallbackPrelude(req);
  return { ...result, fallback: false };
}

export async function requestObserve(
  req: ObserveRequest,
): Promise<ObserveResponse> {
  const result = await post<Omit<ObserveResponse, "fallback">>(
    "/observe",
    req,
    12_000,
  );
  if (!result?.action) return fallbackObserve(req.event, req.fallbackHint);
  // A guide action with nothing to say is worse than the authored hint.
  if (result.action === "guide" && !result.message.trim()) {
    return fallbackObserve(req.event, req.fallbackHint);
  }
  return { ...result, fallback: false };
}

export async function requestProfile(
  req: ProfileRequest,
): Promise<ThinkingProfile> {
  const result = await post<
    Omit<ThinkingProfile, "fallback" | "stats">
  >("/profile", req, 30_000);
  const deterministic = fallbackProfile(req);
  if (!result?.archetype || !result.strength || !result.blindSpot) {
    return deterministic;
  }
  return { ...result, stats: deterministic.stats, fallback: false };
}

export type { EngineEvent };
