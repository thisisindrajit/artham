import type { Mood, SceneVisualKind } from "@/lib/story";
import {
  DAWN_VISUALS,
  VISUAL_FAMILY,
} from "@/constants/story-stage";
import { LabArt } from "@/stories/cold-case/stage";
import { CityArt } from "@/stories/rent-crisis/stage";
import { BridgeArt } from "@/stories/resonance-bridge/stage";
import { ReactorArt } from "@/stories/runaway-reactor/stage";
import { TroyArt } from "@/stories/trojan-horse/stage";

/**
 * Temporary scene art. It already reacts to story state, so a future image can
 * replace the background without changing the stage UI around it.
 */
export function StageGraphic({
  kind,
  mood,
  status,
}: {
  kind: SceneVisualKind;
  mood: Mood;
  /** The scene's own status line. Art that shows a reading must agree with it. */
  status: string;
}) {
  const isDawn = DAWN_VISUALS.includes(kind);
  const isStorm = kind === "storm";
  const family = VISUAL_FAMILY[kind];

  return (
    <svg
      aria-hidden
      viewBox="0 0 520 650"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
    >
      <defs>
        <linearGradient id="stage-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={isDawn ? "#493529" : "#251810"} />
          <stop offset="0.62" stopColor={isStorm ? "#241411" : "#18110d"} />
          <stop offset="1" stopColor="#0c0907" />
        </linearGradient>
        <radialGradient id="stage-glow">
          <stop
            offset="0"
            stopColor={isDawn ? "rgb(var(--accent-rgb) / .48)" : "rgb(var(--accent-rgb) / .2)"}
          />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
        <filter id="stage-blur">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <pattern
          id="stage-grid"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M26 0H0v26"
            fill="none"
            stroke="rgb(var(--accent-rgb) / .065)"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect width="520" height="650" fill="url(#stage-sky)" />
      <rect width="520" height="650" fill="url(#stage-grid)" />
      <circle
        cx={isDawn ? 395 : 255}
        cy={isDawn ? 150 : 235}
        r={isDawn ? 135 : 210}
        fill="url(#stage-glow)"
        filter="url(#stage-blur)"
      />

      {!isStorm &&
        Array.from({ length: 12 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 73 + 28) % 500}
            cy={(i * 47 + 30) % 260}
            r={i % 3 === 0 ? 1.2 : 0.7}
            fill="rgba(244,244,244,.45)"
          />
        ))}

      {isDawn && <circle cx="398" cy="165" r="28" fill="rgb(var(--accent-rgb) / .62)" />}

      {family === "bridge" && <BridgeArt kind={kind} mood={mood} />}
      {family === "reactor" && <ReactorArt kind={kind} mood={mood} status={status} />}
      {family === "city" && <CityArt kind={kind} mood={mood} />}
      {family === "lab" && <LabArt kind={kind} mood={mood} />}
      {family === "troy" && <TroyArt kind={kind} mood={mood} />}

      <rect
        y="520"
        width="520"
        height="130"
        fill="url(#stage-sky)"
        opacity="0.68"
      />
    </svg>
  );
}
