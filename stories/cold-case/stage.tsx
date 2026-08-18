import type { Mood, SceneVisualKind } from "@/lib/story";
import { moodInk } from "@/utils/theme";
import { DNA_PROFILE_PEAKS as PEAKS } from "./constants";

export function LabArt({ kind, mood }: { kind: SceneVisualKind; mood: Mood }) {
  const dawn = kind === "lab-dawn";
  // Only the markers the partial profile actually recovered read as solid.
  const recovered = kind === "evidence" ? 5 : PEAKS.length;

  return (
    <>
      {/* bench */}
      <rect
        x="0"
        y="404"
        width="520"
        height="14"
        fill="rgba(244,244,244,.22)"
      />
      <rect x="0" y="418" width="520" height="102" fill="rgba(6,8,12,.88)" />

      {/* sample racks along the bench */}
      <g>
        {[42, 86, 130, 402, 446].map((x, i) => (
          <g key={x}>
            <rect
              x={x}
              y="366"
              width="22"
              height="38"
              rx="3"
              fill="rgba(10,8,7,.9)"
              stroke="rgba(244,244,244,.25)"
            />
            <rect
              x={x + 4}
              y={378 + (i % 3) * 4}
              width="14"
              height={22 - (i % 3) * 4}
              rx="2"
              fill={
                i === 2 && kind === "evidence"
                  ? "var(--color-rose)"
                  : "rgb(var(--accent-rgb) / .55)"
              }
            />
          </g>
        ))}
      </g>

      {kind === "sequencer" && (
        <g className="animate-story-scan motion-reduce:animate-none">
          <rect
            x="150"
            y="330"
            width="220"
            height="60"
            rx="8"
            fill="rgba(10,8,7,.94)"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={166 + i * 34}
              y={346}
              width="22"
              height="28"
              rx="3"
              fill={`rgb(var(--accent-rgb) / ${0.25 + i * 0.11})`}
            />
          ))}
        </g>
      )}

      {kind === "interview" && (
        <g>
          <rect
            x="150"
            y="336"
            width="220"
            height="12"
            rx="4"
            fill="rgba(244,244,244,.28)"
          />
          {[196, 324].map((x, i) => (
            <g key={x} fill="rgba(244,244,244,.32)">
              <circle cx={x} cy="300" r="15" />
              <path d={`M${x - 21} 336 a21 28 0 0 1 42 0 z`} />
              {i === 1 && (
                <circle cx={x} cy="300" r="21" fill="none" stroke={moodInk(mood)} strokeWidth="2" />
              )}
            </g>
          ))}
        </g>
      )}

      {/* the profile trace — the story's central object */}
      <g>
        <path
          d="M40 300h440"
          stroke="rgba(244,244,244,.2)"
          strokeWidth="1.5"
        />
        {PEAKS.map((p, i) => {
          const solid = i < recovered;
          return (
            <g key={p.x}>
              <path
                d={`M${p.x - 13} 300 L${p.x} ${300 - p.h} L${p.x + 13} 300 Z`}
                fill={
                  solid
                    ? dawn
                      ? "rgb(var(--accent-rgb) / .8)"
                      : "rgb(var(--accent-rgb) / .6)"
                    : "rgba(244,244,244,.08)"
                }
                stroke={solid ? "var(--color-accent)" : "rgba(244,244,244,.16)"}
                strokeWidth="1.5"
                strokeDasharray={solid ? undefined : "3 3"}
              />
              <circle
                cx={p.x}
                cy="312"
                r="2.5"
                fill={solid ? "var(--color-accent)" : "rgba(244,244,244,.2)"}
              />
            </g>
          );
        })}
      </g>

      {kind === "evidence" && (
        <g className="animate-story-weight motion-reduce:animate-none">
          <rect
            x="196"
            y="150"
            width="128"
            height="86"
            rx="6"
            fill="rgba(10,8,7,.92)"
            stroke="var(--color-rose)"
            strokeWidth="2"
          />
          <text
            x="260"
            y="182"
            textAnchor="middle"
            fill="rgba(244,244,244,.5)"
            fontSize="11"
            letterSpacing="2"
          >
            EXHIBIT
          </text>
          <text
            x="260"
            y="212"
            textAnchor="middle"
            fill="var(--color-rose)"
            fontSize="22"
          >
            5 / 9
          </text>
        </g>
      )}

      {kind === "lab" && (
        <circle
          cx="260"
          cy="196"
          r="46"
          fill="none"
          stroke={moodInk(mood)}
          strokeWidth="2"
          strokeDasharray="5 7"
          className="animate-story-scan motion-reduce:animate-none"
        />
      )}
    </>
  );
}
