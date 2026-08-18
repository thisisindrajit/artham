import type { Mood, SceneVisualKind } from "@/lib/story";
import { moodInk } from "@/utils/theme";

export function ReactorArt({
  kind,
  mood,
  status,
}: {
  kind: SceneVisualKind;
  mood: Mood;
  status: string;
}) {
  const hot = kind === "reaction" || mood === "alarm";
  const cooling = kind === "cooling";
  const venting = kind === "vent";
  const liquid = hot ? "rgba(179,38,30,.5)" : "rgb(var(--accent-rgb) / .28)";
  /**
   * The gauge is the number the whole story argues about, so it may never
   * disagree with the status chip above it. If the scene states a temperature,
   * that is the reading. The fallbacks only cover scenes that state none.
   */
  const stated = /(\d{2,3})\s?°?C\b/.exec(status)?.[1];
  const core = stated ?? (hot ? "103" : cooling ? "88" : "96");

  return (
    <>
      {/* plant silhouette behind: columns, tanks, a flare stack */}
      <g fill="rgba(4,6,10,.88)">
        <rect x="0" y="300" width="520" height="200" />
        <rect x="26" y="214" width="30" height="90" />
        <rect x="72" y="248" width="20" height="56" />
        <rect x="430" y="192" width="22" height="112" />
        <rect x="466" y="252" width="34" height="52" rx="6" />
      </g>
      <g
        fill="none"
        stroke="rgba(244,244,244,.16)"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M0 336h520M0 366h520" strokeDasharray="2 9" />
        <path d="M441 192v-26M436 170l5-8 5 8" />
      </g>

      {/* the vessel */}
      <g>
        <rect
          x="176"
          y="252"
          width="168"
          height="200"
          rx="46"
          fill="rgba(10,8,7,.94)"
          stroke="rgba(244,244,244,.4)"
          strokeWidth="3"
        />
        <path
          d={`M180 ${hot ? 300 : 330} h160 v${hot ? 106 : 76} a42 42 0 0 1 -42 42 h-76 a42 42 0 0 1 -42 -42 Z`}
          fill={liquid}
        />
        {/* cooling jacket */}
        <g
          stroke={cooling ? "var(--color-accent)" : "rgba(244,244,244,.28)"}
          strokeWidth={cooling ? 3 : 2}
          className={cooling ? "animate-story-scan motion-reduce:animate-none" : ""}
          fill="none"
        >
          {[292, 320, 348, 376, 404].map((y) => (
            <path
              key={y}
              d={`M166 ${y} h14 M340 ${y} h14`}
              strokeLinecap="round"
            />
          ))}
          <path d="M166 286v124M354 286v124" />
        </g>
        {/* agitator */}
        <line
          x1="260"
          y1="236"
          x2="260"
          y2="400"
          stroke="rgba(244,244,244,.45)"
          strokeWidth="4"
        />
        <path
          d="M232 400h56"
          stroke="rgba(244,244,244,.45)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect
          x="238"
          y="222"
          width="44"
          height="18"
          rx="5"
          fill="rgba(244,244,244,.3)"
        />
        {hot &&
          [212, 244, 276, 308].map((x, i) => (
            <circle
              key={x}
              className="animate-story-bubble motion-reduce:animate-none"
              cx={x}
              cy="410"
              r={i % 2 ? 5 : 3.5}
              fill="rgb(var(--accent-rgb) / .75)"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
      </g>

      {/* feed line in, relief line out */}
      <g
        fill="none"
        stroke="rgba(244,244,244,.42)"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <path d="M92 208h124v44" />
        <path d="M304 252v-38h122" />
      </g>
      <circle
        cx="150"
        cy="208"
        r="10"
        fill="rgba(10,8,7,.9)"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
      />
      <path
        d="M144 208h12"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {venting && (
        <g className="animate-story-plume motion-reduce:animate-none">
          <ellipse
            cx="426"
            cy="182"
            rx="34"
            ry="20"
            fill="rgba(244,244,244,.2)"
          />
          <ellipse
            cx="452"
            cy="152"
            rx="26"
            ry="16"
            fill="rgba(244,244,244,.14)"
          />
          <ellipse
            cx="404"
            cy="146"
            rx="20"
            ry="13"
            fill="rgba(244,244,244,.1)"
          />
        </g>
      )}

      {/* the gauge everybody is staring at */}
      <g>
        <rect
          x="378"
          y="246"
          width="96"
          height="62"
          rx="10"
          fill="rgba(10,8,7,.88)"
          stroke="rgba(244,244,244,.3)"
        />
        <text
          x="426"
          y="272"
          textAnchor="middle"
          fill="rgba(244,244,244,.5)"
          fontSize="11"
          letterSpacing="1.5"
        >
          CORE
        </text>
        <text
          x="426"
          y="296"
          textAnchor="middle"
          fill={hot ? "var(--color-rose)" : moodInk(mood)}
          fontSize="20"
          className={hot ? "animate-story-scan motion-reduce:animate-none" : ""}
        >
          {core}°
        </text>
      </g>
    </>
  );
}
