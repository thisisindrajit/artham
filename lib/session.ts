import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const bypassAuth =
  process.env.NODE_ENV !== "production" &&
  process.env.ARTHAM_BYPASS_AUTH === "true";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  // A real session always wins: the bypass only stands in when nobody is
  // signed in, so signing in locally still shows the real name and photo.
  if (session) return session;

  if (bypassAuth) {
    return {
      user: {
        id: "local-dev-learner",
        name: "Local learner",
        email: "learner@localhost",
        image: null,
      },
      session: {
        id: "local-dev-session",
        userId: "local-dev-learner",
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
        token: "local-dev-session",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as Awaited<ReturnType<typeof auth.api.getSession>>;
  }

  return null;
});
