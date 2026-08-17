import type { Mood, SceneVisual, SceneVisualKind } from "@/lib/story";
import { storyEmoji } from "@/lib/story/emoji";
import { capMarker } from "@/lib/ui";

export function StoryStage({
  visual,
  mood,
  label,
  preview,
  result,
}: {
  visual: SceneVisual;
  mood: Mood;
  /** Ticker text, e.g. "Aetherfall live". Comes from the scenario. */
  label: string;
  preview: string | null;
  result: "success" | "warning" | null;
}) {
  const status =
    result === "success"
      ? "that worked"
      : result === "warning"
        ? "things just changed"
        : visual.status;

  return (
    <aside
      data-art-slot={visual.kind}
      aria-label={`${visual.title}. ${preview ?? visual.caption}`}
      className={`story-stage rise group relative h-[21rem] overflow-hidden rounded-[28px] border bg-black/20 shadow-[0_24px_60px_rgba(90,42,10,0.18)] transition sm:h-96 md:h-[27rem] ${
        preview ? "border-accent/45" : "border-white/15"
      } lg:h-auto lg:aspect-[4/5] lg:shrink-0`}
    >
      <StageGraphic kind={visual.kind} mood={mood} status={visual.status} />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-5">
        <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[12px] leading-none tracking-[0.14em] text-ink/70 uppercase backdrop-blur-md">
          <span
            className={`${capMarker} story-live-dot size-1.5 rounded-full bg-accent`}
          />
          <span aria-hidden className="text-[13px] tracking-normal">
            {storyEmoji(visual.kind)}
          </span>
          {label}
        </span>
        <span className="rounded-full border border-white/10 bg-black/35 px-3 py-2 text-right text-[12px] leading-none text-ink/60 backdrop-blur-md">
          {status}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="rounded-2xl border border-white/10 bg-[#100b08]/78 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={`${capMarker} mt-1.5 size-2 shrink-0 rounded-full bg-accent`}
            />
            <div key={preview ?? visual.caption} className="stage-copy min-w-0">
              <p className="text-[13px] tracking-[0.14em] text-ink/60 uppercase">
                {preview ? "What if…" : visual.title}
              </p>
              <p className="mt-1 text-[15.5px] leading-relaxed text-ink/85">
                {preview ?? visual.caption}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */

type Family = "bridge" | "reactor" | "city" | "lab" | "troy";

const FAMILY: Record<SceneVisualKind, Family> = {
  bridge: "bridge",
  scan: "bridge",
  resonance: "bridge",
  weights: "bridge",
  storm: "bridge",
  dawn: "bridge",
  reactor: "reactor",
  reaction: "reactor",
  cooling: "reactor",
  vent: "reactor",
  "plant-dawn": "reactor",
  city: "city",
  market: "city",
  queue: "city",
  council: "city",
  "city-dawn": "city",
  lab: "lab",
  evidence: "lab",
  sequencer: "lab",
  interview: "lab",
  "lab-dawn": "lab",
  walls: "troy",
  horse: "troy",
  assembly: "troy",
  shore: "troy",
  "troy-dawn": "troy",
};

const DAWN: SceneVisualKind[] = [
  "dawn",
  "plant-dawn",
  "city-dawn",
  "lab-dawn",
  "troy-dawn",
];

/**
 * Temporary scene art. It already reacts to story state, so a future image can
 * replace the background without changing the stage UI around it.
 */
function StageGraphic({
  kind,
  mood,
  status,
}: {
  kind: SceneVisualKind;
  mood: Mood;
  /** The scene's own status line. Art that shows a reading must agree with it. */
  status: string;
}) {
  const isDawn = DAWN.includes(kind);
  const isStorm = kind === "storm";
  const family = FAMILY[kind];

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

function moodInk(mood: Mood): string {
  if (mood === "alarm") return "var(--color-rose)";
  if (mood === "insight") return "var(--color-accent)";
  return "var(--color-ink)";
}

/* -------------------- bridge -------------------- */

function BridgeArt({ kind, mood }: { kind: SceneVisualKind; mood: Mood }) {
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
          className={kind === "resonance" || isStorm ? "story-deck-shake" : ""}
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
        <g className="story-scan">
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
        <g className="story-weight">
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
        <g className="story-wind" fill="none" stroke="rgba(244,244,244,.24)">
          <path d="M-30 160 Q90 125 210 165 T480 145" />
          <path d="M-80 205 Q70 170 200 215 T540 190" />
          <path d="M-50 250 Q110 215 260 255 T570 230" />
        </g>
      )}

      {isStorm && (
        <g className="story-rain" stroke="rgba(244,244,244,.28)">
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

/* -------------------- reactor -------------------- */

function ReactorArt({
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
          className={cooling ? "story-scan" : ""}
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
              className="story-bubble"
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
        <g className="story-plume">
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
          y="330"
          width="96"
          height="62"
          rx="10"
          fill="rgba(10,8,7,.88)"
          stroke="rgba(244,244,244,.3)"
        />
        <text
          x="426"
          y="356"
          textAnchor="middle"
          fill="rgba(244,244,244,.5)"
          fontSize="11"
          letterSpacing="1.5"
        >
          CORE
        </text>
        <text
          x="426"
          y="380"
          textAnchor="middle"
          fill={hot ? "var(--color-rose)" : moodInk(mood)}
          fontSize="20"
          className={hot ? "story-scan" : ""}
        >
          {core}°
        </text>
      </g>
    </>
  );
}

/* -------------------- city -------------------- */

const BLOCKS = [
  { x: 18, y: 262, w: 62, h: 190 },
  { x: 92, y: 222, w: 54, h: 230 },
  { x: 158, y: 292, w: 48, h: 160 },
  { x: 218, y: 202, w: 66, h: 250 },
  { x: 296, y: 268, w: 52, h: 184 },
  { x: 360, y: 236, w: 58, h: 216 },
  { x: 430, y: 300, w: 62, h: 152 },
];

const QUEUE_X = [60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460];

function CityArt({ kind, mood }: { kind: SceneVisualKind; mood: Mood }) {
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
                    className={lit && seed === 1 ? "story-flicker" : ""}
                  />
                );
              }),
            )}
          </g>
        ))}
      </g>

      {kind === "market" && (
        <g className="story-weight">
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
        <g className="story-scan">
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
          className="story-weight"
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

/* -------------------- lab -------------------- */

/** Electropherogram peaks — the shape a DNA profile actually makes. */
const PEAKS = [
  { x: 78, h: 54 },
  { x: 116, h: 88 },
  { x: 158, h: 40 },
  { x: 205, h: 96 },
  { x: 246, h: 62 },
  { x: 292, h: 78 },
  { x: 334, h: 46 },
  { x: 378, h: 90 },
  { x: 420, h: 58 },
];

function LabArt({ kind, mood }: { kind: SceneVisualKind; mood: Mood }) {
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
        <g className="story-scan">
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
        <g className="story-weight">
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
          className="story-scan"
        />
      )}
    </>
  );
}

/* -------------------- troy -------------------- */

const MERLONS = [46, 92, 138, 184, 230, 276, 322, 368, 414, 460];

function TroyArt({ kind, mood }: { kind: SceneVisualKind; mood: Mood }) {
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
              className={i % 2 === 0 ? "story-flicker" : ""}
            />
          ))}
        </>
      )}

      {(kind === "horse" || kind === "troy-dawn") && (
        <g className={kind === "horse" ? "story-weight" : ""}>
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
