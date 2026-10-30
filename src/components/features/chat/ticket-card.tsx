import { cx } from "class-variance-authority";
import { CARD_CLASS } from "@/constants/chat";
import {
  OVERDUE_LABEL,
  PRIORITY_DOT_CLASSES,
  PRIORITY_LABELS,
  TONE_DOT_CLASSES,
  TONE_TEXT_CLASSES,
} from "@/constants/ticket";
import type { TicketDetailView } from "@/domain/ticket-view";
import { toneOfTicketStatus } from "@/utils/ticket-status";
import { useTicketCard } from "@/viewmodels/use-ticket-card";

const SUBCATEGORY_SEPARATOR = " › ";

interface TicketCardProps {
  readonly ticket: TicketDetailView;
}

interface FieldProps {
  readonly label: string;
  readonly children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="flex flex-wrap items-center gap-1.5 text-[14.5px] font-medium text-ink">
        {children}
      </dd>
    </div>
  );
}

export function TicketCard({ ticket }: TicketCardProps) {
  const { updatedRelative } = useTicketCard(ticket);
  const tone = toneOfTicketStatus(ticket.status);
  const category = ticket.subcategory
    ? `${ticket.category}${SUBCATEGORY_SEPARATOR}${ticket.subcategory}`
    : ticket.category;

  return (
    <article aria-label={`Chamado ${ticket.number}`} className={CARD_CLASS}>
      <div className="flex flex-col gap-1.5 px-4.5 pt-4 pb-3.5">
        <div className="flex items-center gap-2 pb-0.5 text-xs text-ink-3">
          <span className="font-medium">Chamado</span>
          <span aria-hidden="true" className="size-0.75 rounded-full bg-rule" />
          <span>{ticket.number}</span>
          <span
            className={cx("ml-auto flex items-center gap-1.5 font-medium", TONE_TEXT_CLASSES[tone])}
          >
            <span
              aria-hidden="true"
              className={cx("size-1.5 rounded-full", TONE_DOT_CLASSES[tone])}
            />
            {ticket.status}
          </span>
        </div>
        <h3 className="text-lg leading-tight font-semibold tracking-[-0.2px] text-ink">
          {ticket.title}
        </h3>
        <p className="text-sm leading-normal whitespace-pre-wrap text-ink-2">
          {ticket.description}
        </p>
      </div>
      <dl className="mx-4.5 mb-4 grid grid-cols-4 gap-x-6 gap-y-3 border-t border-rule pt-3">
        <Field label="Categoria">{category}</Field>
        <Field label="Prioridade">
          <span
            aria-hidden="true"
            className={cx("size-1.5 rounded-full", PRIORITY_DOT_CLASSES[ticket.priority])}
          />
          {PRIORITY_LABELS[ticket.priority]}
        </Field>
        <Field label="Aberto em">{ticket.createdAt}</Field>
        <Field label="Última atualização">
          <span className={cx(ticket.overdue && "text-warning-text")}>{ticket.updatedAt}</span>
          {updatedRelative && (
            <span className="text-sm font-normal text-ink-3">· {updatedRelative}</span>
          )}
          {ticket.overdue && (
            <span className="text-sm font-normal text-ink-3">· {OVERDUE_LABEL}</span>
          )}
        </Field>
        {ticket.affected && <Field label="Afetados">{ticket.affected}</Field>}
        <Field label="Prazo">{ticket.dueAt}</Field>
      </dl>
    </article>
  );
}
