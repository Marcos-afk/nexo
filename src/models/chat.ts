import type { MessageAuthorKind } from "@/domain/conversation";
import type { TicketDetailView, TicketSummaryView } from "@/domain/ticket-view";

export type ChatActionStatusType = "running" | "done" | "failed";

export type ChatNoticeToneType = "info" | "warning" | "danger";

export type ChatNoticeActionType = "request-analyst";

export interface ChatActionProps {
  readonly key: string;
  readonly label: string;
  readonly status: ChatActionStatusType;
}

export type ChatAttachmentProps =
  | { readonly kind: "draft"; readonly key: string; readonly draftId: string }
  | {
      readonly kind: "ticket-list";
      readonly key: string;
      readonly tickets: readonly TicketSummaryView[];
    }
  | { readonly kind: "ticket"; readonly key: string; readonly ticket: TicketDetailView }
  | {
      readonly kind: "choices";
      readonly key: string;
      readonly options: readonly string[];
      readonly answer: string | null;
    };

export interface ChatAnalystProps {
  readonly name: string;
  readonly level: string | null;
}

export interface ChatLineProps {
  readonly id: string;
  readonly authorKind: MessageAuthorKind;
  readonly analyst: ChatAnalystProps | null;
  readonly text: string;
  readonly actions: readonly ChatActionProps[];
  readonly attachments: readonly ChatAttachmentProps[];
}

export interface ChatNoticeProps {
  readonly tone: ChatNoticeToneType;
  readonly text: string;
  readonly action?: ChatNoticeActionType;
}

export interface ChatCounterProps {
  readonly text: string;
  readonly tone: ChatNoticeToneType;
}
