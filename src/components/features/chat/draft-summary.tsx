import { Check, FilePen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DRAFT_MODE_LABELS,
  DRAFT_STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONES,
} from "@/constants/ticket";
import { formatOfficeDateTime } from "@/domain/sla";
import type { DraftProps } from "@/models/draft";
import type { BadgeToneType } from "@/models/ticket";
import { draftCodeOf } from "@/utils/draft-code";

const ICON_SIZE = 14;
const NOT_INFORMED = "Não informado";

const STATUS_TONES = {
  pending: "warning",
  confirmed: "success",
  cancelled: "neutral",
} as const satisfies Record<DraftProps["status"], BadgeToneType>;

interface DraftSummaryProps {
  readonly draft: DraftProps;
}

interface FieldProps {
  readonly label: string;
  readonly children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

function Eyebrow({ draft }: DraftSummaryProps) {
  const isCreated = draft.status === "confirmed" && draft.mode === "create";

  return (
    <div className="flex flex-wrap items-center gap-2 pb-0.5 text-xs text-ink-3">
      <span className="flex items-center gap-1.5 font-semibold text-ink-2">
        {isCreated ? (
          <Check size={ICON_SIZE} aria-hidden="true" />
        ) : (
          <FilePen size={ICON_SIZE} aria-hidden="true" />
        )}
        {isCreated ? "Chamado criado" : DRAFT_MODE_LABELS[draft.mode]}
      </span>
      <span>{isCreated ? draft.targetTicketNumber : `Rascunho ${draftCodeOf(draft.id)}`}</span>
      <Badge.Root tone={STATUS_TONES[draft.status]}>{DRAFT_STATUS_LABELS[draft.status]}</Badge.Root>
    </div>
  );
}

function CreateBody({ draft }: DraftSummaryProps) {
  const { ticket } = draft;

  if (ticket === null) {
    return null;
  }

  return (
    <>
      <h3 className="text-lg leading-tight font-semibold tracking-tight text-ink">
        {ticket.title}
      </h3>
      <p className="text-sm leading-normal whitespace-pre-wrap text-ink-2">{ticket.description}</p>
      <dl className="grid grid-cols-3 gap-6 pt-3">
        <Field label="Categoria">{ticket.category}</Field>
        <Field label="Prioridade">
          <Badge.Root tone={PRIORITY_TONES[ticket.priority]}>
            {PRIORITY_LABELS[ticket.priority]}
          </Badge.Root>
          {draft.dueAt && (
            <span className="mt-1 block text-xs text-ink-3">
              resposta até {formatOfficeDateTime(new Date(draft.dueAt))}
            </span>
          )}
        </Field>
        <Field label="Afetados">{ticket.affected ?? NOT_INFORMED}</Field>
      </dl>
    </>
  );
}

function FollowUpBody({ draft }: DraftSummaryProps) {
  return (
    <>
      <h3 className="text-lg leading-tight font-semibold tracking-tight text-ink">
        {draft.mode === "reopen" ? "Reabrir" : "Acrescentar informação ao"} chamado{" "}
        {draft.targetTicketNumber}
      </h3>
      {draft.note && (
        <p className="text-sm leading-normal whitespace-pre-wrap text-ink-2">{draft.note}</p>
      )}
    </>
  );
}

export function DraftSummary({ draft }: DraftSummaryProps) {
  return (
    <div className="flex flex-col gap-1.5 px-4.5 pt-4 pb-4">
      <Eyebrow draft={draft} />
      {draft.mode === "create" ? <CreateBody draft={draft} /> : <FollowUpBody draft={draft} />}
    </div>
  );
}
