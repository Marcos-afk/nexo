import { ACTION_LABELS, DECISION_UNAVAILABLE_LABEL } from "@/constants/decision";

const MS_PER_SECOND = 1000;
const SECOND_DECIMALS = 1;

export const actionLabelOf = (action: string): string => ACTION_LABELS[action] ?? action;

export const durationLabelOf = (durationMs: number | null): string => {
  if (durationMs === null) {
    return DECISION_UNAVAILABLE_LABEL;
  }

  return durationMs < MS_PER_SECOND
    ? `${durationMs} ms`
    : `${(durationMs / MS_PER_SECOND).toFixed(SECOND_DECIMALS)} s`;
};

export const tokensLabelOf = (tokens: number | null): string =>
  tokens === null ? DECISION_UNAVAILABLE_LABEL : tokens.toLocaleString("pt-BR");

export const inputLabelOf = (input: unknown): string => {
  if (input === null || input === undefined) {
    return DECISION_UNAVAILABLE_LABEL;
  }

  return JSON.stringify(input);
};
