import type { SliderExpr, SliderScene } from "@/types/story";

/**
 * Named formulas keep scenario content declarative. Adding a mechanic means
 * adding a formula here, not adding logic to the renderer.
 */
export function evaluate(
  expr: SliderExpr,
  value: number,
  params: Record<string, number>,
): number {
  switch (expr) {
    case "natural_frequency": {
      // Heavier deck, slower deck: f = f0 * sqrt(m0 / (m0 + k*added))
      const { baseHz, baseMass, massScale } = params;
      return baseHz * Math.sqrt(baseMass / (baseMass + massScale * value));
    }
    case "resonance_ratio": {
      const { driverHz } = params;
      return value / driverHz;
    }
    case "peak_temperature": {
      // Faster feed, more heat released per minute than the jacket can pull
      // out, so the peak the batch reaches climbs with the feed rate.
      const { base, perUnit } = params;
      return base + perUnit * value;
    }
    case "market_rent": {
      // Straight-line supply and demand. Adding homes shifts supply right:
      // demand: Qd = a - b*r     supply: Qs = c + d*r + homes
      // a - b*r = c + d*r + homes  ->  r = (a - c - homes) / (b + d)
      const { demandIntercept, demandSlope, supplyIntercept, supplySlope } =
        params;
      return (
        (demandIntercept - supplyIntercept - value) / (demandSlope + supplySlope)
      );
    }
    case "profile_pool": {
      // How many people in a city of `population` share a DNA profile built
      // from `value` markers. Each extra marker multiplies the rarity, so the
      // pool collapses geometrically: this is why six markers name a crowd and
      // twelve name a person.
      const { population, perMarker } = params;
      return population * Math.pow(perMarker, value);
    }
    case "night_march": {
      // Raiders who can still reach the gate before the alarm carries. Every
      // pace of open ground costs them men — to the ditch, to the sentries,
      // to the dark.
      const { fromInside, perPace } = params;
      return Math.max(0, fromInside + perPace * value);
    }
    case "linear": {
      const { intercept = 0, slope = 1 } = params;
      return intercept + slope * value;
    }
  }
}

export function readoutFor(scene: SliderScene, value: number): number {
  return evaluate(scene.readout.expr, value, scene.readout.params);
}

export function driverFor(scene: SliderScene, value: number): number {
  if (scene.driver.expr === "part_of_total_percent") {
    const numerator = scene.driver.params?.numerator;
    if (Number.isFinite(numerator) && numerator! + value !== 0) {
      return (numerator! / (numerator! + value)) * 100;
    }
  }
  return scene.driver.value;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * 0 = comfortable, 1 = on the edge. What "the edge" means depends on the
 * scene: a rhythm that matches, or a limit the readout is climbing towards.
 */
export function sliderRisk(scene: SliderScene, value: number): number {
  if (scene.driver.expr === "part_of_total_percent") {
    if (value >= scene.target.min && value <= scene.target.max) return 0;
    const distance =
      value < scene.target.min
        ? scene.target.min - value
        : value - scene.target.max;
    return clamp01(distance / Math.max(scene.slider.step, scene.slider.max - scene.slider.min));
  }
  const readout = readoutFor(scene, value);
  const { mode, safeGap } = scene.risk;
  const driver = driverFor(scene, value);
  switch (mode) {
    case "separation":
      return clamp01(1 - Math.abs(readout - driver) / safeGap);
    case "ceiling":
      return clamp01((readout - (driver - safeGap)) / safeGap);
  }
}

export function bandFor(scene: SliderScene, value: number): string {
  for (const band of scene.bands) {
    if (value <= band.max) return band.text;
  }
  return scene.bands[scene.bands.length - 1].text;
}

export function isSliderCorrect(scene: SliderScene, value: number): boolean {
  return value >= scene.target.min && value <= scene.target.max;
}
