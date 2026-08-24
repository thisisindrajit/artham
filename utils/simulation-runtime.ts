import type { DeclarativeSimulationReadout } from "@/types/story";

const CLAUSE =
  /^\s*([a-z][a-z0-9_]*)\s*(==|>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)\s*$/i;

export function evaluateSimulationReadout(
  readout: DeclarativeSimulationReadout,
  values: Record<string, number>,
): string {
  const input = values[readout.inputIds[0]];
  const inputs = readout.inputIds.map((id) => values[id]);
  let output: string;

  switch (readout.operation) {
    case "identity":
      output = formatNumber(input, readout.decimals);
      break;
    case "linear": {
      const intercept = readout.params.intercept ?? 0;
      const slope = readout.params.slope ?? 1;
      output = formatNumber(intercept + slope * input, readout.decimals);
      break;
    }
    case "sum":
      output = formatNumber(
        inputs.reduce((total, value) => total + value, 0),
        readout.decimals,
      );
      break;
    case "difference":
      output = formatNumber(input - inputs.slice(1).reduce((a, b) => a + b, 0), readout.decimals);
      break;
    case "product":
      output = formatNumber(
        inputs.reduce((total, value) => total * value, 1),
        readout.decimals,
      );
      break;
    case "share_percent": {
      const total = inputs.reduce((sum, value) => sum + value, 0);
      output = total === 0 ? readout.fallback : formatNumber((input / total) * 100, readout.decimals);
      break;
    }
    case "base_conversion": {
      const radix = Math.round(readout.params.radix ?? 10);
      output =
        Number.isInteger(input) && radix >= 2 && radix <= 36
          ? input.toString(radix).toUpperCase()
          : readout.fallback;
      break;
    }
    case "lookup": {
      const match = readout.cases.find((item) =>
        Object.entries(item.when).every(
          ([controlId, expected]) => values[controlId] === expected,
        ),
      );
      output = match?.value ?? readout.fallback;
      break;
    }
  }

  return readout.unit && output !== readout.fallback
    ? `${output} ${readout.unit}`
    : output;
}

export function isSimulationSuccess(
  condition: string,
  values: Record<string, number>,
): boolean {
  const clauses = condition.split(/\s*(?:&&|\band\b)\s*/i);
  if (clauses.length === 0) return false;
  return clauses.every((clause) => {
    const match = CLAUSE.exec(clause);
    if (!match) return false;
    const [, id, operator, rawExpected] = match;
    const actual = values[id];
    const expected = Number(rawExpected);
    if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
    switch (operator) {
      case "==":
        return actual === expected;
      case ">=":
        return actual >= expected;
      case "<=":
        return actual <= expected;
      case ">":
        return actual > expected;
      case "<":
        return actual < expected;
      default:
        return false;
    }
  });
}

export function legacySimulationReadouts(
  modelKind: string,
): DeclarativeSimulationReadout[] {
  if (modelKind === "ternary_converter") {
    return [
      {
        id: "ternary_output",
        label: "Ternary Output",
        operation: "base_conversion",
        inputIds: ["binary_input"],
        params: { radix: 3 },
        cases: [],
        fallback: "—",
        successValue: "110",
        unit: "",
        decimals: 0,
      },
    ];
  }
  if (modelKind === "lookup_table_tracer") {
    const bases = ["A", "C", "G", "T"];
    const cases = bases.flatMap((_, previous) =>
      bases
        .filter((__, candidate) => candidate !== previous)
        .map((value, trit) => ({
          when: { prev_nucleotide: previous, current_trit: trit },
          value,
        })),
    );
    return [
      {
        id: "next_nucleotide",
        label: "Next Nucleotide",
        operation: "lookup",
        inputIds: ["prev_nucleotide", "current_trit"],
        params: {},
        cases,
        fallback: "—",
        successValue: "G",
        unit: "",
        decimals: 0,
      },
    ];
  }
  return [];
}

function formatNumber(value: number, decimals: number): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : "—";
}
