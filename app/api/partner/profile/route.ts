import { requestProfile } from "@/lib/partner/client";
import { resolveScenario } from "@/lib/resolve-scenario";
import { scenarioToContext } from "@/utils/partner-context";
import type { NotesDigest } from "@/types/partner";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    scenarioId?: string;
    notes?: NotesDigest;
    outcome?: "success" | "partial";
  };

  const scenario = body.scenarioId
    ? await resolveScenario(body.scenarioId)
    : null;
  if (!scenario || !body.notes) {
    return Response.json({ error: "Malformed profile request" }, { status: 400 });
  }

  const result = await requestProfile({
    scenario: scenarioToContext(scenario),
    notes: body.notes,
    outcome: body.outcome ?? "success",
  });

  return Response.json(result);
}
