"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ScenarioCard } from "@/components/scenario-card";
import type { Scenario } from "@/types/story";

/**
 * The one story grid. Explore and the dashboard render the *same* card and the
 * same intent-prefetch behaviour, so a story looks and feels identical wherever
 * it is surfaced. Capped at three columns: wider rows shrink the cover art
 * past the point where it reads, and leave ragged final rows on big screens.
 */
export function StoryGrid({
  scenarios,
  isAuthenticated,
  startIndex = 0,
  showShortcutHints = true,
  trailing,
}: {
  scenarios: Scenario[];
  isAuthenticated: boolean;
  /** Offset for the stagger and the number-key hints. */
  startIndex?: number;
  showShortcutHints?: boolean;
  trailing?: ReactNode;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState<string | null>(null);

  const preload = useCallback(
    (scenario: Scenario) => {
      if (isAuthenticated) {
        router.prefetch(scenario.playPath ?? `/play/${scenario.id}`);
      }
    },
    [isAuthenticated, router],
  );

  useEffect(() => {
    function resetArmedCard() {
      setArmed(null);
    }

    window.addEventListener("pageshow", resetArmedCard);
    window.addEventListener("popstate", resetArmedCard);
    return () => {
      window.removeEventListener("pageshow", resetArmedCard);
      window.removeEventListener("popstate", resetArmedCard);
    };
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {scenarios.map((scenario, index) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          index={startIndex + index}
          armed={armed === scenario.id}
          showShortcutHint={showShortcutHints}
          onArm={() => setArmed(scenario.id)}
          onIntent={() => preload(scenario)}
        />
      ))}
      {trailing}
    </div>
  );
}
