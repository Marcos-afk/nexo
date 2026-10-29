import { Button } from "@/components/ui/button";
import {
  allTicketsLabelOf,
  NO_TICKETS_LABEL,
  OTHER_TICKETS_LABEL,
  THIS_CONVERSATION_LABEL,
} from "@/constants/console";
import type { ConversationTicketsProps } from "@/models/console";
import { TicketRow } from "./ticket-row";

interface TicketsOverviewProps {
  readonly tickets: ConversationTicketsProps;
  readonly onOpen: (number: string) => void;
  readonly onShowAll: () => void;
}

interface SectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="px-2.5 text-xs font-semibold tracking-wide text-ink-3 uppercase">{title}</h3>
      <ul className="flex flex-col">{children}</ul>
    </section>
  );
}

export function TicketsOverview({ tickets, onOpen, onShowAll }: TicketsOverviewProps) {
  const current = tickets.tickets.filter((item) => item.isCurrent);
  const others = tickets.tickets.filter((item) => !item.isCurrent);

  if (tickets.tickets.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-ink-3">{NO_TICKETS_LABEL}</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-2">
      {current.length > 0 && (
        <Section title={THIS_CONVERSATION_LABEL}>
          {current.map((item) => (
            <TicketRow key={item.number} item={item} onOpen={onOpen} />
          ))}
        </Section>
      )}
      {others.length > 0 && (
        <Section title={OTHER_TICKETS_LABEL}>
          {others.map((item) => (
            <TicketRow key={item.number} item={item} onOpen={onOpen} />
          ))}
        </Section>
      )}
      <Button.Root variant="outline" onClick={onShowAll} className="mx-2 h-9 rounded-lg text-xs">
        {allTicketsLabelOf(tickets.employeeName)}
      </Button.Root>
    </div>
  );
}
