import { Badge } from "@/components/ui/badge";
import { OVERDUE_LABEL, PRIORITY_LABELS, PRIORITY_TONES } from "@/constants/ticket";
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
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

export function TicketCard({ ticket }: TicketCardProps) {
  const { updatedRelative } = useTicketCard(ticket);
  const category = ticket.subcategory
    ? `${ticket.category}${SUBCATEGORY_SEPARATOR}${ticket.subcategory}`
    : ticket.category;

  return (
    <article
      aria-label={`Chamado ${ticket.number}`}
      className="flex w-full max-w-150 flex-col gap-1.5 rounded-2xl border border-ink/10 bg-paper px-4.5 py-4"
    >
      <div className="flex flex-wrap items-center gap-2 pb-0.5 text-xs text-ink-3">
        <span className="font-data font-semibold text-ink-2">{ticket.number}</span>
        <Badge.Root tone={toneOfTicketStatus(ticket.status)}>{ticket.status}</Badge.Root>
      </div>
      <h3 className="text-lg leading-tight font-semibold tracking-tight text-ink">
        {ticket.title}
      </h3>
      <p className="text-sm leading-normal whitespace-pre-wrap text-ink-2">{ticket.description}</p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 pt-3">
        <Field label="Categoria">{category}</Field>
        <Field label="Prioridade">
          <Badge.Root tone={PRIORITY_TONES[ticket.priority]}>
            {PRIORITY_LABELS[ticket.priority]}
          </Badge.Root>
        </Field>
        <Field label="Aberto em">{ticket.createdAt}</Field>
        <Field label="Última atualização">
          {ticket.updatedAt}
          {updatedRelative && <span className="text-ink-3"> · {updatedRelative}</span>}
          {ticket.overdue && (
            <Badge.Root tone="danger" className="ml-1.5">
              {OVERDUE_LABEL}
            </Badge.Root>
          )}
        </Field>
        {ticket.affected && <Field label="Afetados">{ticket.affected}</Field>}
        <Field label="Prazo">{ticket.dueAt}</Field>
      </dl>
    </article>
  );
}
