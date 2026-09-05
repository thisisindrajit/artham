import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PARTNER_BASE_URL } from "@/constants/partner";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to create a story." }, { status: 401 });
  }

  const body = await request.json();
  const response = await fetch(`${PARTNER_BASE_URL}/story-jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...body,
      learner_id: session.user.id || session.user.email,
    }),
    cache: "no-store",
  });

  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
