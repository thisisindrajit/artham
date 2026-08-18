import type { EngineEvent } from "@/types/engine";
import { getScenario } from "@/utils/story";
import type { ScenarioContext } from "@/types/partner";

export function scenarioContext(scenarioId: string): ScenarioContext | null {
  const scenario = getScenario(scenarioId);
  if (!scenario) return null;
  return {
    id: scenario.id,
    title: scenario.title,
    domain: scenario.domain,
    learningGoal: scenario.learningGoal,
    role: scenario.intro.role,
    greeting: scenario.partnerGreeting,
  };
}

/**
 * The story author's hint for this beat. It is both the offline fallback and
 * the ceiling on how revealing the agent is allowed to be.
 */
export function hintForEvent(event: EngineEvent): string {
  switch (event.kind) {
    case "mistake":
    case "help_request":
      return event.hint;
    case "key_decision":
      return event.probe;
    case "self_correction":
      return "Acknowledge the change of approach without restating the answer.";
    case "experiment":
      return "Comment on how they converged, not on whether the value is right.";
    case "reasoning":
      return "Reflect back what their explanation reveals about their model.";
  }
}
