import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.ARTHAM_BYPASS_AUTH === "true"
  ) {
    return NextResponse.next();
  }

  if (getSessionCookie(request)) {
    return NextResponse.next();
  }

  const signInURL = new URL("/sign-in", request.url);
  signInURL.searchParams.set(
    "callbackURL",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(signInURL);
}

export const config = {
  matcher: ["/dashboard/:path*", "/explore/:path*", "/play/:path*"],
};
