import type { UIMessage } from "ai";
import { useState } from "react";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { countEmployeeMessages } from "@/utils/chat-lines";

export function useChatSession(session: ChatSession, initialMessages: UIMessage[]) {
  const [mode, setMode] = useState(session.mode);
  const [base, setBase] = useState({
    count: session.employeeMessageCount,
    userMessages: countEmployeeMessages(initialMessages),
  });

  const reset = (next: ChatSession, history: readonly UIMessage[]) => {
    setMode(next.mode);
    setBase({ count: next.employeeMessageCount, userMessages: countEmployeeMessages(history) });
  };

  return { mode, setMode, base, reset };
}
