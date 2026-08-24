import { requestPrelude } from "@/lib/partner/client";
import { resolveScenario } from "@/lib/resolve-scenario";
import { scenarioToContext } from "@/utils/partner-context";

export async function POST(request: Request) {
  const { scenarioId } = (await request.json()) as { scenarioId?: string };
  const scenario = scenarioId ? await resolveScenario(scenarioId) : null;

  if (!scenario) {
    return Response.json({ error: "Unknown scenario" }, { status: 404 });
  }

  const result = await requestPrelude({
    scenario: scenarioToContext(scenario),
    intro: scenario.intro.text,
    fallbackQuestion: scenario.preSession,
  });

  return Response.json(result);
}
