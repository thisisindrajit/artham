import type { Mood, SceneVisualKind } from "@/lib/story";
import { moodInk } from "@/utils/theme";

export function BridgeArt({ kind, mood }: { kind: SceneVisualKind; mood: Mood }) {
  const isStorm = kind === "storm";
  const hasScan = kind === "scan" || kind === "resonance";
  const hasWeights = kind === "weights";

  return (
    <>
      <path
        d="M0 322 92 232l58 62 78-103 92 115 65-75 135 104v96H0Z"
        fill="rgba(4,6,10,.88)"
      />
      <path
        d="M0 350 118 279l73 51 68-76 94 71 64-42 103 78v84H0Z"
        fill="rgba(7,9,13,.96)"
      />

      <g opacity="0.9">
        <path
          d="M38 395 Q260 350 482 395"
          fill="none"
          stroke="rgba(244,244,244,.34)"
          strokeWidth="1.4"
        />
        <path
          d="M86 390V284M434 390V284"
          stroke="rgba(244,244,244,.45)"
          strokeWidth="5"
        />
        <path
          d="M86 292 Q260 455 434 292"
          fill="none"
          stroke="rgba(244,244,244,.3)"
          strokeWidth="1.5"
        />
        {[128, 172, 216, 260, 304, 348, 392].map((x) => (
          <line
            key={x}
            x1={x}
            y1={x < 260 ? 330 + (260 - x) * 0.27 : 330 + (x - 260) * 0.27}
            x2={x}
            y2={385 - Math.abs(260 - x) * 0.08}
            stroke="rgba(244,244,244,.2)"
            strokeWidth="1"
          />
        ))}
        <path
          className={
            kind === "resonance" || isStorm
              ? "animate-story-deck-shake motion-reduce:animate-none"
              : ""
          }
          d="M38 394 Q118 386 198 396 T358 394 T482 395"
          fill="none"
          stroke={moodInk(mood)}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Notebook annotations sketched over the feed: span between the towers,
          and the amplitude somebody is watching climb. */}
      <g
        stroke="rgba(244,244,244,.2)"
        fill="none"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M86 250h348" strokeDasharray="4 7" />
        <path d="M86 244v12M434 244v12" />
        <path d="M470 374v40" strokeDasharray="3 5" />
        <path d="M466 379l4-5 4 5M466 409l4 5 4-5" />
        <circle cx="470" cy="394" r="2" />
      </g>

      {hasScan && (
        <g className="animate-story-scan motion-reduce:animate-none">
          <line
            x1="90"
            y1="370"
            x2="430"
            y2="370"
            stroke="var(--color-accent)"
            strokeWidth="1"
            strokeDasharray="5 8"
          />
          {[130, 260, 390].map((x) => (
            <g key={x}>
              <circle cx={x} cy="390" r="8" fill="rgb(var(--accent-rgb) / .14)" />
              <circle cx={x} cy="390" r="3" fill="var(--color-accent)" />
            </g>
          ))}
        </g>
      )}

      {hasWeights && (
        <g className="animate-story-weight motion-reduce:animate-none">
          <line
            x1="260"
            y1="396"
            x2="260"
            y2="480"
            stroke="rgba(244,244,244,.45)"
            strokeWidth="2"
          />
          <rect
            x="225"
            y="470"
            width="70"
            height="48"
            rx="8"
            fill="rgb(var(--accent-rgb) / .18)"
            stroke="var(--color-accent)"
          />
          <text
            x="260"
            y="499"
            textAnchor="middle"
            fill="var(--color-accent)"
            fontSize="14"
          >
            LOAD
          </text>
        </g>
      )}

      {(isStorm || kind === "bridge") && (
        <g
          className="animate-story-wind motion-reduce:animate-none"
          fill="none"
          stroke="rgba(244,244,244,.24)"
        >
          <path d="M-30 160 Q90 125 210 165 T480 145" />
          <path d="M-80 205 Q70 170 200 215 T540 190" />
          <path d="M-50 250 Q110 215 260 255 T570 230" />
        </g>
      )}

      {isStorm && (
        <g
          className="animate-story-rain motion-reduce:animate-none"
          stroke="rgba(244,244,244,.28)"
        >
          {Array.from({ length: 18 }).map((_, i) => {
            const x = (i * 41 + 12) % 520;
            const y = (i * 67 + 45) % 360;
            return <line key={i} x1={x} y1={y} x2={x - 9} y2={y + 28} />;
          })}
        </g>
      )}
    </>
  );
}
