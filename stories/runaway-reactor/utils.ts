export function reactionHeat(temperature: number): number {
  return 6 * Math.exp((temperature - 60) / 22);
}

export function jacketCooling(
  temperature: number,
  power: number,
): number {
  return (0.6 + (power / 100) * 4.4) * (temperature - 25);
}
