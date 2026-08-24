import type { EngineEvent } from "@/lib/engine";
import { requestObserve } from "@/lib/partner/client";
import { resolveScenario } from "@/lib/resolve-scenario";
import { hintForEvent, scenarioToContext } from "@/utils/partner-context";
import type { NotesDigest } from "@/types/partner";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    scenarioId?: string;
    event?: EngineEvent;
    notes?: NotesDigest;
  };

  const scenario = body.scenarioId
    ? await resolveScenario(body.scenarioId)
    : null;
  if (!scenario || !body.event || !body.notes) {
    return Response.json({ error: "Malformed observe request" }, { status: 400 });
  }

  const result = await requestObserve({
    scenario: scenarioToContext(scenario),
    event: body.event,
    notes: body.notes,
    fallbackHint: hintForEvent(body.event),
  });

  return Response.json(result);
}
