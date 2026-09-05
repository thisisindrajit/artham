import Link from "next/link";
import { ArthamMark } from "@/components/artham-mark";
import { AuthStatus } from "@/components/auth/auth-status";
import type { AuthUser } from "@/components/auth/user-avatar";
import { pageShell } from "@/constants/ui";

export function AppHeader({
  user,
  compact = false,
  progress,
}: {
  user: AuthUser | null;
  compact?: boolean;
  progress?: { label: string; value: number };
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/80 shadow-[0_4px_18px_rgba(111,56,17,0.05)] backdrop-blur-xl">
      <div
        className={`${pageShell} flex items-center justify-between gap-4 ${
          compact ? "py-3" : "py-4"
        }`}
      >
        <Link
          href={user ? "/dashboard" : "/"}
          className="group inline-flex shrink-0 items-center gap-4"
        >
          <ArthamMark
            size={28}
            className="transition-transform duration-300 ease-[var(--ease-bounce)] group-hover:-rotate-12 group-hover:scale-110"
          />
          <span className="hidden text-[13px] font-bold tracking-[0.18em] text-faint uppercase sm:inline">
            Artham
          </span>
        </Link>

        {progress && (
          <span className="ml-auto min-w-0 truncate text-[12px] tracking-[0.14em] text-faint uppercase sm:text-[13px]">
            {progress.label}
          </span>
        )}

        <nav className={`${progress ? "" : "ml-auto"} hidden items-center gap-2 text-[13px] font-semibold text-muted sm:flex`}>
          <Link
            href="/dashboard"
            className="rounded-full px-3 py-2 transition hover:bg-ink/[0.06] hover:text-ink"
          >
            Dashboard
          </Link>
          <Link
            href="/explore"
            className="rounded-full px-3 py-2 transition hover:bg-ink/[0.06] hover:text-ink"
          >
            Explore
          </Link>
          <Link
            href="/create"
            className="rounded-full px-3 py-2 transition hover:bg-ink/[0.06] hover:text-ink"
          >
            Create story
          </Link>
        </nav>

        <AuthStatus user={user} />
      </div>
      {progress && (
        <div className="h-1 w-full bg-accent/12">
          <div
            className="h-1 rounded-r-full bg-accent transition-all duration-700"
            style={{ width: `${Math.max(0, Math.min(100, progress.value))}%` }}
          />
        </div>
      )}
    </header>
  );
}
