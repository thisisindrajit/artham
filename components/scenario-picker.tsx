"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ScenarioFilterBar } from "@/components/scenario-filter-bar";
import { StoryGrid } from "@/components/story-grid";
import type {
  ScenarioFilter,
  ScenarioPickerProps,
} from "@/types/components";
import {
  countScenarios,
  filterScenarios,
  scenarioDomains,
} from "@/utils/scenario-picker";

export function ScenarioPicker({
  scenarios,
  isAuthenticated,
}: ScenarioPickerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<ScenarioFilter>("all");
  const domains = useMemo(() => scenarioDomains(scenarios), [scenarios]);
  const visible = useMemo(
    () => filterScenarios(scenarios, filter),
    [filter, scenarios],
  );

  useEffect(() => {
    function openWithNumberKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      const index = Number(event.key) - 1;
      const scenario = visible[index];
      if (!Number.isInteger(index) || !scenario) return;

      event.preventDefault();
      router.push(scenario.playPath ?? `/play/${scenario.id}`);
    }

    window.addEventListener("keydown", openWithNumberKey);
    return () => window.removeEventListener("keydown", openWithNumberKey);
  }, [router, visible]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <ScenarioFilterBar
        domains={domains}
        active={filter}
        onChange={setFilter}
        total={scenarios.length}
        countOf={(domain) => countScenarios(scenarios, domain)}
      />

      <StoryGrid
        scenarios={visible}
        isAuthenticated={isAuthenticated}
        trailing={
          filter === "all" ? (
            <div
              className="animate-rise flex min-h-[12rem] flex-col items-start justify-center gap-3 rounded-3xl border border-dashed border-ink/25 bg-white/55 p-6 motion-reduce:animate-none"
              style={{ animationDelay: `${260 + visible.length * 70}ms` }}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-ink/30 text-[15px] font-semibold text-ink/60">
                ?
              </span>
              <p className="text-[14px] leading-relaxed text-ink/70 sm:text-[15px]">
                More situations are being written — including one about a
                crowded lift, and one about a river that changed its mind.
              </p>
            </div>
          ) : null
        }
      />
    </div>
  );
}
