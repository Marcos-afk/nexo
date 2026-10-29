import { Badge } from "@/components/ui/badge";
import { SUMMARY_TITLE } from "@/constants/console";
import { PRIORITY_LABELS, PRIORITY_TONES } from "@/constants/ticket";
import type { ConsoleConversationProps } from "@/models/console";

interface CaseSummaryProps {
  readonly conversation: ConsoleConversationProps;
}

export function CaseSummary({ conversation }: CaseSummaryProps) {
  const { handoffSummary, handoffReason, handoffLevel, ticket, mode } = conversation;

  if (handoffSummary === null || mode === "agent") {
    return null;
  }

  return (
    <details
      open={mode === "awaiting_analyst"}
      className="mx-6 mt-4 rounded-xl border border-rule bg-paper px-4 py-3"
    >
      <summary className="cursor-pointer text-sm font-semibold text-ink">{SUMMARY_TITLE}</summary>
      <div className="mt-2 flex flex-col gap-2 text-sm text-ink-2">
        <p className="whitespace-pre-wrap">{handoffSummary}</p>
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-3">
          {handoffReason && (
            <div className="flex gap-1">
              <dt>Motivo:</dt>
              <dd className="text-ink">{handoffReason}</dd>
            </div>
          )}
          {handoffLevel && (
            <div className="flex gap-1">
              <dt>Destino:</dt>
              <dd className="text-ink">Suporte {handoffLevel}</dd>
            </div>
          )}
          {ticket && (
            <div className="flex items-center gap-1.5">
              <dt>Chamado:</dt>
              <dd className="flex items-center gap-1.5 text-ink">
                <span className="font-data">{ticket.number}</span>
                <Badge.Root tone={PRIORITY_TONES[ticket.priority]}>
                  {PRIORITY_LABELS[ticket.priority]}
                </Badge.Root>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </details>
  );
}
