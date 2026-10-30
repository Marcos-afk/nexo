import type { UsageSummary } from "@/domain/usage";
import { usageLabelOf } from "@/utils/usage-format";

interface UsageLineProps {
  readonly usage: UsageSummary;
}

export function UsageLine({ usage }: UsageLineProps) {
  const label = usageLabelOf(usage);

  return label && <p className="mx-6 mt-3 text-xs text-ink-3">Uso do agent: {label}</p>;
}
