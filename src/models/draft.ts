import type { DraftMode, DraftStatus } from "@/domain/conversation";
import type { CreateTicketInput } from "@/domain/ticket-input";

export interface DraftProps {
  readonly id: string;
  readonly mode: DraftMode;
  readonly status: DraftStatus;
  readonly targetTicketNumber: string | null;
  readonly ticket: CreateTicketInput | null;
  readonly note: string | null;
  readonly dueAt: string | null;
}

export interface DraftResponseProps {
  readonly draft: DraftProps;
}

export interface DraftStatusResponseProps {
  readonly draft: { readonly id: string; readonly status: DraftStatus };
}

export interface ConfirmDraftResponseProps extends DraftStatusResponseProps {
  readonly ticket: { readonly number: string; readonly title: string };
}

export interface DraftNoteValues {
  note: string;
}

export interface DraftEditValues {
  title: string;
  description: string;
  category: CreateTicketInput["category"];
  priority: CreateTicketInput["priority"];
  affected: string;
}
