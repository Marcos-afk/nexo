import type { MessageAuthorKind } from "@/domain/conversation";

export type ChatActionStatusType = "running" | "done" | "failed";

export type ChatNoticeToneType = "info" | "warning" | "danger";

export interface ChatActionProps {
  readonly key: string;
  readonly label: string;
  readonly status: ChatActionStatusType;
}

export interface ChatLineProps {
  readonly id: string;
  readonly authorKind: MessageAuthorKind;
  readonly text: string;
  readonly actions: readonly ChatActionProps[];
}

export interface ChatNoticeProps {
  readonly tone: ChatNoticeToneType;
  readonly text: string;
}

export interface ChatCounterProps {
  readonly text: string;
  readonly tone: ChatNoticeToneType;
}
