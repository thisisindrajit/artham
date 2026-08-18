export function linePath(
  points: { x: number; y: number }[],
  xRange: [number, number],
  yRange: [number, number],
  width: number,
  height: number,
): string {
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  return points
    .map(({ x, y }, index) => {
      const px = ((x - xMin) / (xMax - xMin)) * width;
      const py = height - ((y - yMin) / (yMax - yMin)) * height;
      return `${index ? "L" : "M"}${px.toFixed(1)} ${Math.max(0, Math.min(height, py)).toFixed(1)}`;
    })
    .join(" ");
}
