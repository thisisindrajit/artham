"use client";

/**
 * The deck, drawn as a travelling wave. Amplitude is the resonance risk, so
 * the learner can see the consequence of the slider before committing to it.
 */
export function DeckWave({
  amplitude,
  className = "",
}: {
  amplitude: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(1, amplitude));
  const height = 2 + clamped * 26;
  const speed = 6 - clamped * 3.4;
  const color =
    clamped > 0.72
      ? "var(--color-rose)"
      : clamped > 0.38
        ? "var(--color-accent)"
        : "var(--color-sage)";

  return (
    <svg
      viewBox="0 0 400 80"
      preserveAspectRatio="none"
      aria-hidden
      className={className}
    >
      <g className="deck-wave" style={{ animationDuration: `${speed}s` }}>
        {[0, 400].map((offset) => (
          <path
            key={offset}
            d={wavePath(offset, height)}
            fill="none"
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
            style={{ transition: "stroke 500ms ease" }}
          />
        ))}
      </g>
      <line
        x1="0"
        y1="40"
        x2="400"
        y2="40"
        stroke="var(--color-line)"
        strokeWidth="0.5"
        strokeDasharray="3 6"
      />
    </svg>
  );
}

function wavePath(offset: number, amplitude: number): string {
  const points: string[] = [];
  for (let x = 0; x <= 400; x += 4) {
    const y = 40 - Math.sin((x / 100) * Math.PI * 2) * amplitude;
    points.push(`${x + offset},${y.toFixed(2)}`);
  }
  return `M ${points.join(" L ")}`;
}
