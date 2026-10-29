export interface LoginStatsProps {
  readonly firstResponseSeconds: number | null;
  readonly resolvedWithoutQueuePercent: number | null;
  readonly analystsOnline: number;
}

export interface LoginStatsView {
  readonly firstResponse: string;
  readonly withoutQueue: string;
  readonly analystsOnline: string;
}
