import { cx } from "class-variance-authority";
import {
  DRAFT_MODE_LABELS,
  DRAFT_STATUS_LABELS,
  PRIORITY_DOT_CLASSES,
  PRIORITY_LABELS,
} from "@/constants/ticket";
import { formatOfficeDateTime } from "@/domain/sla";
import type { DraftProps } from "@/models/draft";
import { draftCodeOf } from "@/utils/draft-code";

const NOT_INFORMED = "Não informado";

const STATUS_DOT_CLASSES = {
  pending: "bg-warning",
  confirmed: "bg-success",
  cancelled: "bg-ink/40",
} as const satisfies Record<DraftProps["status"], string>;

const STATUS_TEXT_CLASSES = {
  pending: "text-warning-text",
  confirmed: "text-success-text",
  cancelled: "text-ink-3",
} as const satisfies Record<DraftProps["status"], string>;

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
      <dd className="flex items-center gap-1.5 text-[14.5px] font-medium text-ink">{children}</dd>
    </div>
  );
}

function Eyebrow({ draft }: DraftSummaryProps) {
  const isCreated = draft.status === "confirmed" && draft.mode === "create";

  return (
    <div className="flex items-center gap-2 pb-0.5 text-xs text-ink-3">
      <span className="font-medium">
        {isCreated ? "Chamado criado" : DRAFT_MODE_LABELS[draft.mode]}
      </span>
      <span aria-hidden="true" className="size-0.75 rounded-full bg-rule" />
      <span>{isCreated ? draft.targetTicketNumber : `Rascunho ${draftCodeOf(draft.id)}`}</span>
      <span
        className={cx(
          "ml-auto flex items-center gap-1.5 font-medium",
          STATUS_TEXT_CLASSES[draft.status],
        )}
      >
        <span
          aria-hidden="true"
          className={cx("size-1.5 rounded-full", STATUS_DOT_CLASSES[draft.status])}
        />
        {DRAFT_STATUS_LABELS[draft.status]}
      </span>
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
      <h3 className="text-lg leading-tight font-semibold tracking-[-0.2px] text-ink">
        {ticket.title}
      </h3>
      <p className="text-sm leading-normal whitespace-pre-wrap text-ink-2">{ticket.description}</p>
      <dl className="mt-2 grid grid-cols-3 gap-6 border-t border-rule pt-3">
        <Field label="Categoria">{ticket.category}</Field>
        <Field label="Prioridade">
          <span
            aria-hidden="true"
            className={cx("size-1.5 rounded-full", PRIORITY_DOT_CLASSES[ticket.priority])}
          />
          {PRIORITY_LABELS[ticket.priority]}
          {draft.dueAt && (
            <span className="text-sm font-normal text-ink-3">
              · resposta até {formatOfficeDateTime(new Date(draft.dueAt))}
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
