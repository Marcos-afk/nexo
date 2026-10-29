import type { ChatAttachmentProps } from "@/models/chat";
import { ChoiceChips } from "./choice-chips";
import { DraftCard } from "./draft-card";
import { TicketCard } from "./ticket-card";
import { TicketList } from "./ticket-list";

interface AttachmentViewProps {
  readonly attachment: ChatAttachmentProps;
  readonly isSendDisabled: boolean;
  readonly onSend: (text: string) => void;
}

export function AttachmentView({ attachment, isSendDisabled, onSend }: AttachmentViewProps) {
  switch (attachment.kind) {
    case "draft":
      return <DraftCard draftId={attachment.draftId} />;
    case "ticket-list":
      return (
        <TicketList tickets={attachment.tickets} isDisabled={isSendDisabled} onSelect={onSend} />
      );
    case "ticket":
      return <TicketCard ticket={attachment.ticket} />;
    case "choices":
      return (
        <ChoiceChips
          options={attachment.options}
          answer={attachment.answer}
          isDisabled={isSendDisabled}
          onSelect={onSend}
        />
      );
  }
}
