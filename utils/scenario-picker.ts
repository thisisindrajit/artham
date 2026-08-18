import type { Domain, Scenario } from "@/types/story";
import type { ScenarioFilter } from "@/types/components";

export function scenarioDomains(scenarios: Scenario[]): Domain[] {
  return Array.from(new Set(scenarios.map((scenario) => scenario.domain)));
}

export function filterScenarios(
  scenarios: Scenario[],
  filter: ScenarioFilter,
): Scenario[] {
  return filter === "all"
    ? scenarios
    : scenarios.filter((scenario) => scenario.domain === filter);
}

export function countScenarios(
  scenarios: Scenario[],
  domain: Domain,
): number {
  return scenarios.filter((scenario) => scenario.domain === domain).length;
}
