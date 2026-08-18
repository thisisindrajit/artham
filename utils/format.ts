export function formatThousands(value: number): string {
  return `${Math.round(value)},000`;
}

/** The economics model stores rent in hundreds of dollars. */
export function formatMonthlyRent(value: number): string {
  return `$${Math.round(value * 100).toLocaleString()}`;
}
