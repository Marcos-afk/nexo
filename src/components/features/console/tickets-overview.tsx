import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  allTicketsLabelOf,
  NO_TICKETS_LABEL,
  OTHER_TICKETS_LABEL,
  THIS_CONVERSATION_LABEL,
} from "@/constants/console";
import type { ConversationTicketsProps } from "@/models/console";
import { CurrentTicketCard, TicketRow } from "./ticket-row";

const ARROW_SIZE = 14;

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
      <h3 className="text-xs font-semibold text-ink-3">{title}</h3>
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
    <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 pt-6 pb-5">
      {current.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-ink-3">{THIS_CONVERSATION_LABEL}</h3>
          {current.map((item) => (
            <CurrentTicketCard key={item.number} item={item} onOpen={onOpen} />
          ))}
        </section>
      )}
      {others.length > 0 && (
        <Section title={OTHER_TICKETS_LABEL}>
          {others.map((item) => (
            <TicketRow key={item.number} item={item} onOpen={onOpen} />
          ))}
        </Section>
      )}
      <Button.Root variant="outline" onClick={onShowAll} className="h-9 gap-1.5 rounded-lg text-sm">
        {allTicketsLabelOf(tickets.employeeName)}
        <ArrowUpRight size={ARROW_SIZE} aria-hidden="true" className="text-ink-3" />
      </Button.Root>
    </div>
  );
}
