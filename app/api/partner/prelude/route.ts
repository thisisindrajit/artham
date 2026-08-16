import { getScenario } from "@/lib/story";
import { requestPrelude } from "@/lib/partner/client";
import { scenarioContext } from "@/lib/partner/context";

export async function POST(request: Request) {
  const { scenarioId } = (await request.json()) as { scenarioId?: string };
  const scenario = scenarioId ? getScenario(scenarioId) : undefined;
  const context = scenarioId ? scenarioContext(scenarioId) : null;

  if (!scenario || !context) {
    return Response.json({ error: "Unknown scenario" }, { status: 404 });
  }

  const result = await requestPrelude({
    scenario: context,
    intro: scenario.intro.text,
    fallbackQuestion: scenario.preSession,
  });

  return Response.json(result);
}
