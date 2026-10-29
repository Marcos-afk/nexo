import type { ReactNode } from "react";
import type { MessageAuthorKind } from "@/domain/conversation";
import type { ChatLineProps } from "@/models/chat";
import { AgentMessage } from "./agent-message";
import { SystemMessage } from "./system-message";
import { UserMessage } from "./user-message";

interface MessageViewProps {
  readonly line: ChatLineProps;
  readonly isSendDisabled: boolean;
  readonly onSend: (text: string) => void;
}

type MessageView = (props: MessageViewProps) => ReactNode;

const MESSAGE_VIEWS = {
  employee: UserMessage,
  agent: AgentMessage,
  analyst: AgentMessage,
  system: SystemMessage,
} as const satisfies Record<MessageAuthorKind, MessageView>;

interface MessageListProps {
  readonly lines: readonly ChatLineProps[];
  readonly isSendDisabled: boolean;
  readonly onSend: (text: string) => void;
}

export function MessageList({ lines, isSendDisabled, onSend }: MessageListProps) {
  return lines.map((line) => {
    const View = MESSAGE_VIEWS[line.authorKind];

    return <View key={line.id} line={line} isSendDisabled={isSendDisabled} onSend={onSend} />;
  });
}
