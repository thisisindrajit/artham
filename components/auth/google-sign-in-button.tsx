"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { buttonPrimary } from "@/constants/ui";

export function GoogleSignInButton({
  callbackURL,
}: {
  callbackURL: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setIsPending(true);
    setError(null);

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
      errorCallbackURL: "/sign-in?error=oauth",
    });

    if (result.error) {
      setError(result.error.message ?? "Google sign-in could not be started.");
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        data-press="deep"
        disabled={isPending}
        onClick={signIn}
        className={`${buttonPrimary} flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-[16px] font-semibold`}
      >
        <span
          aria-hidden
          className="grid size-6 place-items-center rounded-full bg-white font-sans text-[14px] font-bold text-ink"
        >
          G
        </span>
        {isPending ? "Opening Google…" : "Continue with Google"}
      </button>
      <p
        aria-live="polite"
        className="min-h-5 text-center text-[13px] text-rose"
      >
        {error}
      </p>
    </div>
  );
}
