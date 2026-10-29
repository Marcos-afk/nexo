import type { LoginStatsProps, LoginStatsView } from "@/models/stats";

export const UNAVAILABLE_STAT = "—";

export const UNAVAILABLE_STATS_VIEW: LoginStatsView = {
  firstResponse: UNAVAILABLE_STAT,
  withoutQueue: UNAVAILABLE_STAT,
  analystsOnline: UNAVAILABLE_STAT,
};

const formatOptional = (value: number | null, format: (rounded: number) => string): string =>
  value === null ? UNAVAILABLE_STAT : format(Math.round(value));

export const formatLoginStats = (stats: LoginStatsProps | null): LoginStatsView => {
  if (stats === null) {
    return UNAVAILABLE_STATS_VIEW;
  }

  return {
    firstResponse: formatOptional(stats.firstResponseSeconds, (seconds) => `${seconds} s`),
    withoutQueue: formatOptional(stats.resolvedWithoutQueuePercent, (percent) => `${percent}%`),
    analystsOnline: String(stats.analystsOnline),
  };
};
