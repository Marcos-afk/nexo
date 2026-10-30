export interface TurnUsage {
  readonly tokensIn: number | null;
  readonly tokensOut: number | null;
  readonly latencyMs: number | null;
  readonly model: string;
}

export interface ModelUsage {
  readonly model: string;
  readonly turns: number;
}

export interface UsageSummary {
  readonly turns: number;
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly totalTokens: number;
  readonly averageLatencyMs: number | null;
  readonly maxLatencyMs: number | null;
  readonly models: readonly ModelUsage[];
}

const sumOf = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

const presentOf = (values: readonly (number | null)[]): readonly number[] =>
  values.filter((value): value is number => value !== null);

const modelsOf = (turns: readonly TurnUsage[]): readonly ModelUsage[] =>
  [
    ...turns.reduce(
      (counts, turn) => counts.set(turn.model, (counts.get(turn.model) ?? 0) + 1),
      new Map<string, number>(),
    ),
  ]
    .map(([model, count]) => ({ model, turns: count }))
    .toSorted((a, b) => b.turns - a.turns || a.model.localeCompare(b.model));

export const summarizeUsage = (turns: readonly TurnUsage[]): UsageSummary => {
  const tokensIn = sumOf(presentOf(turns.map((turn) => turn.tokensIn)));
  const tokensOut = sumOf(presentOf(turns.map((turn) => turn.tokensOut)));
  const latencies = presentOf(turns.map((turn) => turn.latencyMs));

  return {
    turns: turns.length,
    tokensIn,
    tokensOut,
    totalTokens: tokensIn + tokensOut,
    averageLatencyMs:
      latencies.length === 0 ? null : Math.round(sumOf(latencies) / latencies.length),
    maxLatencyMs: latencies.length === 0 ? null : Math.max(...latencies),
    models: modelsOf(turns),
  };
};
