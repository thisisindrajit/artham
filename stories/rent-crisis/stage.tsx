import type { Mood, SceneVisualKind } from "@/lib/story";
import { moodInk } from "@/utils/theme";
import {
  CITY_BLOCKS as BLOCKS,
  CITY_QUEUE_X as QUEUE_X,
} from "./constants";

export function CityArt({ kind, mood }: { kind: SceneVisualKind; mood: Mood }) {
  const dawn = kind === "city-dawn";
  // When homes sit empty, far fewer windows are lit.
  const empty = kind === "market" || kind === "queue";

  return (
    <>
      <g>
        {BLOCKS.map((b, bi) => (
          <g key={b.x}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill="rgba(6,8,12,.94)"
              stroke="rgba(244,244,244,.16)"
            />
            {Array.from({ length: Math.floor(b.h / 26) }).map((_, r) =>
              Array.from({ length: Math.floor(b.w / 20) }).map((_, c) => {
                const seed = (bi * 7 + r * 3 + c * 5) % 10;
                const lit = empty ? seed < 3 : seed < 7;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={b.x + 7 + c * 20}
                    y={b.y + 12 + r * 26}
                    width="9"
                    height="13"
                    rx="1.5"
                    fill={
                      lit
                        ? dawn
                          ? "rgb(var(--accent-rgb) / .75)"
                          : "rgb(var(--accent-rgb) / .6)"
                        : "rgba(244,244,244,.09)"
                    }
                    className={
                      lit && seed === 1
                        ? "animate-story-flicker motion-reduce:animate-none"
                        : ""
                    }
                  />
                );
              }),
            )}
          </g>
        ))}
      </g>

      {kind === "market" && (
        <g className="animate-story-weight motion-reduce:animate-none">
          <rect
            x="176"
            y="122"
            width="168"
            height="74"
            rx="10"
            fill="rgba(10,8,7,.92)"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
          <text
            x="260"
            y="150"
            textAnchor="middle"
            fill="rgba(244,244,244,.55)"
            fontSize="12"
            letterSpacing="2"
          >
            TO LET
          </text>
          <text
            x="260"
            y="180"
            textAnchor="middle"
            fill="var(--color-accent)"
            fontSize="24"
          >
            $2,500
          </text>
          <path
            d="M260 196v26"
            stroke="rgba(244,244,244,.35)"
            strokeWidth="3"
          />
        </g>
      )}

      {kind === "queue" && (
        <g className="animate-story-scan motion-reduce:animate-none">
          {QUEUE_X.map((x, i) => (
            <g key={x} fill="rgb(var(--accent-rgb) / .55)">
              {i > 6 && (
                <rect
                  x={x - 11}
                  y="470"
                  width="22"
                  height="50"
                  fill="rgba(179,38,30,.18)"
                />
              )}
              <circle cx={x} cy="480" r="7" />
              <path d={`M${x - 9} 516 a9 14 0 0 1 18 0 z`} />
            </g>
          ))}
        </g>
      )}

      {kind === "council" && (
        <g>
          <rect
            x="132"
            y="440"
            width="256"
            height="16"
            rx="4"
            fill="rgba(244,244,244,.3)"
          />
          <rect
            x="228"
            y="456"
            width="64"
            height="60"
            rx="6"
            fill="rgba(10,8,7,.9)"
            stroke={moodInk(mood)}
            strokeWidth="2"
          />
          {[152, 190, 330, 368].map((x) => (
            <g key={x} fill="rgba(244,244,244,.3)">
              <circle cx={x} cy="418" r="8" />
              <path d={`M${x - 10} 440 a10 15 0 0 1 20 0 z`} />
            </g>
          ))}
          <path
            d="M260 456v-28"
            stroke="rgba(244,244,244,.35)"
            strokeWidth="2"
          />
        </g>
      )}

      {dawn && (
        <g
          fill="none"
          stroke="rgb(var(--accent-rgb) / .5)"
          strokeWidth="3"
          strokeLinecap="round"
          className="animate-story-weight motion-reduce:animate-none"
        >
          <path d="M120 200v-84M120 116h72M156 116v22" />
          <path d="M396 226v-70M396 156h64M430 156v20" />
        </g>
      )}

      <g fill="none" stroke="rgba(244,244,244,.14)" strokeWidth="1">
        <path d="M0 452h520" />
        <path d="M0 470h520" strokeDasharray="14 12" />
      </g>
    </>
  );
}
