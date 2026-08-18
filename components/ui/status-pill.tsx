import { PILL_TONE_CLASSES } from "@/constants/ui";
import type { StatusPillProps } from "@/types/components";

export function StatusPill({
  children,
  tone = "accent",
  className = "",
}: StatusPillProps) {
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${PILL_TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
