import type { Mood, SceneVisualKind } from "@/lib/story";
import { moodInk } from "@/utils/theme";
import { TROY_MERLONS as MERLONS } from "./constants";

export function TroyArt({ kind, mood }: { kind: SceneVisualKind; mood: Mood }) {
  const dawn = kind === "troy-dawn";
  const shore = kind === "shore";

  return (
    <>
      {shore ? (
        <>
          {/* empty beach: the ships are gone, the fire pits are not */}
          <path
            d="M0 392 Q130 380 260 392 T520 386 V520 H0 Z"
            fill="rgba(6,8,12,.9)"
          />
          {[70, 150, 236, 322, 408, 470].map((x, i) => (
            <g key={x}>
              <ellipse
                cx={x}
                cy={418 + (i % 3) * 16}
                rx="26"
                ry="7"
                fill="rgba(244,244,244,.1)"
              />
              <ellipse
                cx={x}
                cy={418 + (i % 3) * 16}
                rx="12"
                ry="3.5"
                fill="rgb(var(--accent-rgb) / .35)"
              />
            </g>
          ))}
          {/* drag ruts leading inland */}
          <path
            d="M180 520 L246 396 M236 520 L268 396"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            fill="none"
          />
        </>
      ) : (
        <>
          {/* the wall */}
          <rect
            x="0"
            y="352"
            width="520"
            height="168"
            fill="rgba(6,8,12,.94)"
            stroke="rgba(244,244,244,.16)"
          />
          {MERLONS.map((x) => (
            <rect
              key={x}
              x={x}
              y="330"
              width="28"
              height="24"
              fill="rgba(6,8,12,.94)"
              stroke="rgba(244,244,244,.16)"
            />
          ))}
          {[0, 1, 2, 3].map((r) =>
            MERLONS.slice(0, 9).map((x) => (
              <rect
                key={`${r}-${x}`}
                x={x + 4}
                y={368 + r * 34}
                width="40"
                height="26"
                rx="2"
                fill="none"
                stroke="rgba(244,244,244,.07)"
              />
            )),
          )}
          {/* the Scaean gate */}
          <path
            d="M232 520 v-92 a28 28 0 0 1 56 0 v92 z"
            fill="rgba(10,8,7,.96)"
            stroke={kind === "walls" ? moodInk(mood) : "rgba(244,244,244,.3)"}
            strokeWidth="2.5"
          />
          {/* torches on the rampart */}
          {[74, 190, 330, 446].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy="342"
              r="4"
              fill="rgb(var(--accent-rgb) / .8)"
              className={
                i % 2 === 0
                  ? "animate-story-flicker motion-reduce:animate-none"
                  : ""
              }
            />
          ))}
        </>
      )}

      {(kind === "horse" || kind === "troy-dawn") && (
        <g
          className={
            kind === "horse"
              ? "animate-story-weight motion-reduce:animate-none"
              : ""
          }
        >
          {/* body */}
          <rect
            x="176"
            y="196"
            width="168"
            height="84"
            rx="14"
            fill="rgba(10,8,7,.94)"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
          />
          {/* plank seams — the join a carpenter would notice */}
          {[206, 236, 266, 296, 326].map((x) => (
            <path
              key={x}
              d={`M${x} 198 v80`}
              stroke="rgb(var(--accent-rgb) / .3)"
              strokeWidth="1.5"
            />
          ))}
          {/* neck and head */}
          <path
            d="M312 200 l30 -54 a16 16 0 0 1 26 10 l-14 46 z"
            fill="rgba(10,8,7,.94)"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
          />
          <circle cx="348" cy="160" r="3.5" fill={moodInk(mood)} />
          {/* legs on a wheeled cradle */}
          {[196, 232, 288, 324].map((x) => (
            <path
              key={x}
              d={`M${x} 280 v46`}
              stroke="var(--color-accent)"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.8"
            />
          ))}
          <rect
            x="182"
            y="326"
            width="156"
            height="9"
            rx="4"
            fill="rgba(244,244,244,.3)"
          />
          {dawn && (
            <circle
              cx="260"
              cy="238"
              r="86"
              fill="none"
              stroke="rgb(var(--accent-rgb) / .35)"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
          )}
        </g>
      )}

      {kind === "assembly" && (
        <g>
          {[112, 158, 204, 316, 362, 408].map((x, i) => (
            <g key={x} fill="rgba(244,244,244,.3)">
              <circle cx={x} cy="250" r="13" />
              <path d={`M${x - 18} 286 a18 24 0 0 1 36 0 z`} />
              {i === 2 && (
                <path
                  d={`M${x + 16} 250 h34`}
                  stroke={moodInk(mood)}
                  strokeWidth="2.5"
                />
              )}
            </g>
          ))}
          {/* the king's seat, empty of an answer */}
          <rect
            x="238"
            y="240"
            width="44"
            height="50"
            rx="5"
            fill="rgba(10,8,7,.9)"
            stroke={moodInk(mood)}
            strokeWidth="2"
          />
        </g>
      )}
    </>
  );
}
