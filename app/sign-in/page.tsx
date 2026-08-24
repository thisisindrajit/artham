import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArthamMark } from "@/components/artham-mark";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { PaperBackdrop } from "@/components/paper-backdrop";
import { card, sticker } from "@/constants/ui";
import { auth } from "@/lib/auth";

function safeCallbackURL(value: string | string[] | undefined): string {
  const callbackURL = Array.isArray(value) ? value[0] : value;
  return callbackURL?.startsWith("/") && !callbackURL.startsWith("//")
    ? callbackURL
    : "/";
}

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams;
  const callbackURL = safeCallbackURL(params.callbackURL);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect(callbackURL);
  }

  return (
    <div
      data-mood="welcome"
      className="relative isolate grid min-h-dvh place-items-center px-4 py-12 sm:px-6"
    >
      <PaperBackdrop />
      <main
        className={`${card} animate-rise w-full max-w-md rounded-3xl px-6 py-8 motion-reduce:animate-none sm:px-9 sm:py-10`}
      >
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Back to Artham">
            <ArthamMark size={38} priority />
          </Link>
          <span
            className={`${sticker} rounded-full bg-primary px-3 py-2 text-[11px] leading-none font-semibold tracking-[0.08em] text-primary-ink uppercase`}
          >
            Your story awaits
          </span>
        </div>

        <div className="mt-9 space-y-3">
          <p className="text-[12px] font-bold tracking-[0.18em] text-muted uppercase">
            Sign in to play
          </p>
          <h1 className="text-4xl leading-tight font-light tracking-tight text-ink">
            Keep your thinking
            <br />
            <span className="font-semibold">connected.</span>
          </h1>
          <p className="max-w-sm text-[16px] leading-relaxed text-ink/70">
            Use your Google account to start a story and return to your learning
            journey.
          </p>
        </div>

        <div className="mt-8">
          <GoogleSignInButton callbackURL={callbackURL} />
        </div>

        {params.error && (
          <p
            role="alert"
            className="mt-2 text-center text-[13px] leading-relaxed text-rose"
          >
            Google sign-in did not complete. Please try again.
          </p>
        )}

        <p className="mt-5 text-center text-[12px] leading-relaxed text-faint">
          Artham only requests your basic Google profile and email.
        </p>
      </main>
    </div>
  );
}
