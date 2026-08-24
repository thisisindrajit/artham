import { DeckWave } from "./deck-wave";
import type { SliderScene } from "@/lib/story";

/** The instrument above the slider track. One per scene family. */
export function SliderMeter({
  scene,
  risk,
  readout,
  driver,
}: {
  scene: SliderScene;
  risk: number;
  readout: number;
  driver: number;
}) {
  if (scene.meter === "wave") {
    return (
      <div className="h-20 w-full bg-accent/6">
        <DeckWave amplitude={risk} className="h-full w-full" />
      </div>
    );
  }

  const tone =
    risk > 0.72 ? "var(--color-rose)"
    : risk > 0.38 ? "var(--color-accent)"
    : "var(--color-sage)";

  if (scene.driver.expr === "part_of_total_percent") {
    const runwayFill = Math.max(0, Math.min(100, (readout / 30) * 100));
    const ownershipFill = Math.max(0, Math.min(100, driver));
    return (
      <div className="grid gap-4 bg-accent/6 px-5 py-5 sm:grid-cols-2">
        <LiveBar
          label={scene.readout.label}
          value={`${readout.toFixed(scene.readout.decimals)} ${scene.readout.unit}`}
          fill={runwayFill}
          color={tone}
        />
        <LiveBar
          label={scene.driver.label}
          value={`${driver.toFixed(scene.readout.decimals)}${scene.driver.unit}`}
          fill={ownershipFill}
          color="var(--color-sage)"
        />
      </div>
    );
  }

  if (scene.meter === "thermometer") {
    const span = scene.driver.value * 1.15;
    const fill = Math.max(0, Math.min(100, (readout / span) * 100));
    const limit = (scene.driver.value / span) * 100;
    return (
      <div className="space-y-2 bg-accent/6 px-5 py-5">
        <div className="relative h-5 w-full overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full transition-[width,background-color] duration-300"
            style={{ width: `${fill}%`, background: tone }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-ink/45"
            style={{ left: `${limit}%` }}
          />
        </div>
        <div className="flex justify-between text-[12.5px] text-faint">
          <span>batch temperature</span>
          <span>
            {scene.driver.label} {scene.driver.value}
            {scene.driver.unit}
          </span>
        </div>
      </div>
    );
  }

  function LiveBar({
    label,
    value,
    fill,
    color,
  }: {
    label: string;
    value: string;
    fill: number;
    color: string;
  }) {
    return (
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
          <span className="text-faint">{label}</span>
          <span className="font-semibold text-ink">{value}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${fill}%`, background: color }}
          />
        </div>
      </div>
    );
  }

  if (scene.meter === "crowd") {
    // An exponential readout pinned to a bar is unreadable; people are not.
    const dots = Math.max(0, Math.min(48, Math.round(readout)));
    const alone = readout < 1;
    return (
      <div className="bg-accent/6 px-5 py-5">
        <div
          className="flex min-h-14 flex-wrap content-center items-center gap-1.5"
          role="img"
          aria-label={
            alone
              ? "Fewer than one person still matches this profile"
              : `About ${Math.round(readout).toLocaleString()} people still match this profile`
          }
        >
          {alone ?
            <span className="flex items-center gap-2.5">
              <span className="size-3.5 rounded-full bg-sage" />
              <span className="text-[14px] font-semibold text-ink">
                one person left
              </span>
            </span>
          : <>
              {Array.from({ length: dots }).map((_, i) => (
                <span
                  key={i}
                  className="size-3.5 rounded-full"
                  style={{ background: tone }}
                />
              ))}
              {readout > 48 && (
                <span
                  className="self-center pl-1 text-[13px] font-semibold"
                  style={{ color: tone }}
                >
                  + {(Math.round(readout) - 48).toLocaleString()} more
                </span>
              )}
            </>
          }
        </div>
        <div className="mt-3 flex justify-between text-[12.5px] text-faint">
          <span>{scene.readout.label}</span>
          <span>
            {scene.driver.label} {scene.driver.value}
            {scene.driver.unit}
          </span>
        </div>
      </div>
    );
  }

  // market / gauge: a bar read against the line that must not be crossed
  const span = scene.driver.value * 2;
  const fill = Math.max(0, Math.min(100, (readout / span) * 100));
  const limit = 50;
  return (
    <div className="space-y-2 bg-accent/6 px-5 py-5">
      <div className="relative h-5 w-full overflow-hidden rounded-full bg-ink/8">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-300"
          style={{ width: `${fill}%`, background: tone }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-ink/45"
          style={{ left: `${limit}%` }}
        />
      </div>
      <div className="flex justify-between text-[12.5px] text-faint">
        <span>{scene.meter === "gauge" ? scene.readout.label : "market rent"}</span>
        <span>
          {scene.driver.label} {scene.driver.value}
          {scene.driver.unit}
        </span>
      </div>
    </div>
  );
}

export function Metric({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "rose" | "accent" | "sage" | "muted";
}) {
  const color = {
    rose: "text-rose",
    accent: "text-ink",
    sage: "text-sage",
    muted: "text-ink/70",
  }[tone];
  return (
    <div className="border-r border-line px-4 py-3 last:border-r-0">
      <p className="mb-1 text-[12px] leading-tight tracking-[0.14em] text-faint uppercase">
        {label}
      </p>
      <p
        className={`font-mono tabular-nums text-[21px] font-light transition-colors ${color}`}
      >
        {value}
        <span className="ml-0.5 text-[14px] text-faint">{unit}</span>
      </p>
    </div>
  );
}
