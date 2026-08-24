import { buttonPrimary } from "@/constants/ui";

export function PrimaryButton({
  onClick,
  label,
  delay = 0,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  delay?: number;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-press="deep"
      className={`${buttonPrimary} group animate-rise inline-flex items-center gap-3 rounded-full px-6 py-3 text-[16px] font-bold italic motion-reduce:animate-none disabled:cursor-not-allowed disabled:opacity-30`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className="not-italic transition-transform duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </button>
  );
}

export function HelpButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="animate-rise text-[15px] font-bold italic text-muted underline decoration-2 decoration-accent/55 underline-offset-4 transition motion-reduce:animate-none hover:text-ink disabled:opacity-40"
      style={{ animationDelay: "500ms" }}
    >
      Give me a tiny clue
    </button>
  );
}


export function NudgeButton({
  dir,
  label,
  disabled,
  onClick,
}: {
  dir: "up" | "down";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg border border-line bg-white text-muted shadow-[0_2px_0_rgba(23,23,23,0.1)] transition hover:-translate-y-0.5 hover:border-accent/55 hover:bg-accent/10 hover:text-ink active:shadow-none disabled:cursor-not-allowed disabled:opacity-25"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
        <path
          d={dir === "up" ? "M8 3.5 L13 10 L3 10 Z" : "M8 12.5 L3 6 L13 6 Z"}
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
