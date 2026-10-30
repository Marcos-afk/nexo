import type { UsageSummary } from "@/domain/usage";

const MS_PER_SECOND = 1000;
const numberFormat = new Intl.NumberFormat("pt-BR");
const secondsFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const secondsOf = (ms: number): string => `${secondsFormat.format(ms / MS_PER_SECOND)} s`;

export const tokensOf = (value: number): string => numberFormat.format(value);

export const usageLabelOf = (usage: UsageSummary): string | null => {
  if (usage.turns === 0) {
    return null;
  }

  const answers = `${usage.turns} ${usage.turns === 1 ? "resposta" : "respostas"} do agent`;
  const tokens = `${tokensOf(usage.totalTokens)} tokens (${tokensOf(usage.tokensIn)} entrada · ${tokensOf(usage.tokensOut)} saída)`;
  const latency =
    usage.averageLatencyMs === null
      ? null
      : `latência média ${secondsOf(usage.averageLatencyMs)}${usage.maxLatencyMs === null ? "" : ` (máx. ${secondsOf(usage.maxLatencyMs)})`}`;

  return [answers, tokens, latency].filter((part) => part !== null).join(" · ");
};
