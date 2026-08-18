import { PROGRESS_TONE_CLASSES } from "@/constants/ui";
import type { ProgressBarProps } from "@/types/components";

export function ProgressBar({
  value,
  tone = "accent",
  className = "",
  barClassName = "",
}: ProgressBarProps) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-ink/8 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${PROGRESS_TONE_CLASSES[tone]} ${barClassName}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
