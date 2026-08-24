"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { UserAvatar, type AuthUser } from "@/components/auth/user-avatar";

interface AuthStatusProps {
  user: AuthUser | null;
}

export function AuthStatus({ user }: AuthStatusProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="rounded-full border border-ink/15 bg-white/90 px-4 py-2 text-[13px] font-semibold text-ink shadow-[0_3px_0_rgba(23,23,23,0.08)] transition hover:-translate-y-0.5 hover:border-ink/30"
      >
        Sign in
      </Link>
    );
  }

  async function signOut() {
    setIsPending(true);
    setError(null);
    const result = await authClient.signOut();

    if (result.error) {
      setError(result.error.message ?? "Sign out failed.");
      setIsPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      <Link
        href="/dashboard"
        aria-label={`${user.name || user.email || "User"} dashboard`}
        title={user.name || user.email || "Dashboard"}
        className="group inline-flex items-center rounded-full border border-ink/10 bg-white/90 p-1 shadow-[0_3px_0_rgba(23,23,23,0.08)] transition hover:-translate-y-0.5 hover:border-ink/25"
      >
        <UserAvatar user={user} size={30} />
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={signOut}
        className="shrink-0 whitespace-nowrap rounded-full border border-ink/15 bg-white/90 px-4 py-2 text-[13px] font-semibold text-ink shadow-[0_3px_0_rgba(23,23,23,0.08)] transition hover:not-disabled:-translate-y-0.5 hover:not-disabled:border-ink/30 disabled:opacity-60"
      >
        {isPending ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <span role="alert" className="text-[12px] text-rose">
          {error}
        </span>
      )}
    </div>
  );
}
