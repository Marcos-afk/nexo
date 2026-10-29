import { Badge } from "@/components/ui/badge";
import { HISTORY_LABEL } from "@/constants/console";
import {
  OVERDUE_LABEL,
  PRIORITY_LABELS,
  PRIORITY_TONES,
  TICKET_STATUS_TONES,
} from "@/constants/ticket";
import { ticketStatusLabels } from "@/domain/ticket";
import type { ConsoleTicketDetailProps } from "@/models/console";
import { dateTimeOf } from "@/utils/console-format";

interface FieldProps {
  readonly label: string;
  readonly children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

interface TicketDetailProps {
  readonly detail: ConsoleTicketDetailProps;
}

export function TicketDetail({ detail }: TicketDetailProps) {
  const { ticket, overdue, events } = detail;
  const category = ticket.subcategory
    ? `${ticket.category} › ${ticket.subcategory}`
    : ticket.category;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-data font-semibold text-ink-2">{ticket.number}</span>
          <Badge.Root tone={TICKET_STATUS_TONES[ticket.status]}>
            {ticketStatusLabels[ticket.status]}
          </Badge.Root>
          {overdue && <Badge.Root tone="danger">{OVERDUE_LABEL}</Badge.Root>}
        </span>
        <h3 className="text-base leading-tight font-semibold text-ink">{ticket.title}</h3>
        <p className="text-sm leading-normal whitespace-pre-wrap text-ink-2">
          {ticket.description}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Categoria">{category}</Field>
        <Field label="Prioridade">
          <Badge.Root tone={PRIORITY_TONES[ticket.priority]}>
            {PRIORITY_LABELS[ticket.priority]}
          </Badge.Root>
        </Field>
        <Field label="Afetados">{ticket.affected ?? "—"}</Field>
        <Field label="Prazo">{dateTimeOf(ticket.dueAt)}</Field>
        <Field label="Aberto em">{dateTimeOf(ticket.createdAt)}</Field>
        <Field label="Atualizado em">{dateTimeOf(ticket.updatedAt)}</Field>
      </dl>
      <section className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">
          {HISTORY_LABEL}
        </h4>
        <ol className="flex flex-col gap-2 border-l border-rule pl-3">
          {events.map((event) => (
            <li key={event.id} className="flex flex-col gap-0.5">
              <span className="text-sm text-ink">{event.text}</span>
              <time className="text-xs text-ink-3">{dateTimeOf(event.at)}</time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
