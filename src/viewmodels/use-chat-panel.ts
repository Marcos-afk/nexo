import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { type SubmitEvent, useState } from "react";
import { CHAT_ENDPOINT, CHAT_READY_STATUS } from "@/constants/chat";
import type { ChatLineProps } from "@/models/chat";
import { messageTextOf } from "@/utils/message-text";

const AUTHOR_BY_ROLE = {
  user: "Você",
  assistant: "Nexo",
  system: "Nexo",
} as const satisfies Record<UIMessage["role"], string>;

export function useChatPanel(initialMessages: UIMessage[]) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: CHAT_ENDPOINT }),
  });

  const lines: ChatLineProps[] = messages.map((message) => ({
    id: message.id,
    author: AUTHOR_BY_ROLE[message.role],
    text: messageTextOf(message),
  }));

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    void sendMessage({ text: input });
    setInput("");
  };

  return {
    lines,
    input,
    setInput,
    onSubmit,
    status,
    isBusy: status !== CHAT_READY_STATUS,
    hasError: error !== undefined,
  };
}
