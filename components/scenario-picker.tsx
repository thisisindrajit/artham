"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ScenarioCard } from "@/components/scenario-card";
import { ScenarioFilterBar } from "@/components/scenario-filter-bar";
import type {
  ScenarioFilter,
  ScenarioPickerProps,
} from "@/types/components";
import {
  countScenarios,
  filterScenarios,
  scenarioDomains,
} from "@/utils/scenario-picker";

export function ScenarioPicker({ scenarios }: ScenarioPickerProps) {
  const router = useRouter();
  const [armed, setArmed] = useState<string | null>(null);
  const [filter, setFilter] = useState<ScenarioFilter>("all");
  const domains = useMemo(() => scenarioDomains(scenarios), [scenarios]);
  const visible = useMemo(
    () => filterScenarios(scenarios, filter),
    [filter, scenarios],
  );

  useEffect(() => {
    for (const scenario of scenarios) {
      router.prefetch(`/play/${scenario.id}`);
    }
  }, [router, scenarios]);

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
      setArmed(scenario.id);
      router.push(`/play/${scenario.id}`);
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

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {visible.map((scenario, index) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            index={index}
            armed={armed === scenario.id}
            onArm={() => setArmed(scenario.id)}
          />
        ))}

        {filter === "all" && (
          <div
            className="animate-rise flex min-h-[12rem] flex-col items-start justify-center gap-3 rounded-3xl border border-dashed border-ink/25 bg-white/55 p-6 motion-reduce:animate-none"
            style={{ animationDelay: `${260 + visible.length * 70}ms` }}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-ink/30 text-[15px] font-semibold text-ink/60">
              ?
            </span>
            <p className="text-[14px] leading-relaxed text-ink/70 sm:text-[15px]">
              More situations are being written — including one about a crowded
              lift, and one about a river that changed its mind.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
