import { requestProfile } from "@/lib/partner/client";
import { scenarioContext } from "@/utils/partner-context";
import type { NotesDigest } from "@/types/partner";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    scenarioId?: string;
    notes?: NotesDigest;
    outcome?: "success" | "partial";
  };

  const context = body.scenarioId ? scenarioContext(body.scenarioId) : null;
  if (!context || !body.notes) {
    return Response.json({ error: "Malformed profile request" }, { status: 400 });
  }

  const result = await requestProfile({
    scenario: context,
    notes: body.notes,
    outcome: body.outcome ?? "success",
  });

  return Response.json(result);
}
