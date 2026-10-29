"use client";

import { useRef } from "react";
import type { ConsoleMessageProps } from "@/models/console";
import { toEntries } from "@/utils/console-conversation";
import { useMessageScroll } from "@/viewmodels/use-message-scroll";
import { useNow } from "@/viewmodels/use-now";
import { MessageBubble, SystemLine } from "./message-bubble";

export interface MessageFocusProps {
  readonly highlightQuery: string;
  readonly activeMessageId: string | null;
  readonly decisionMessageId: string | null;
}

interface ConversationMessagesProps {
  readonly messages: readonly ConsoleMessageProps[];
  readonly employeeName: string;
  readonly focus: MessageFocusProps;
}

export function ConversationMessages({ messages, employeeName, focus }: ConversationMessagesProps) {
  const now = useNow();
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useMessageScroll({
    containerRef,
    endRef,
    lastId: messages.at(-1)?.id,
    activeMessageId: focus.activeMessageId,
    focusMessageId: focus.decisionMessageId,
  });

  return (
    <div ref={containerRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
      {toEntries(messages, now).map((entry) => {
        if (entry.kind === "day") {
          return (
            <p key={entry.key} className="text-center text-xs font-semibold text-ink-3">
              {entry.label}
            </p>
          );
        }

        return entry.message.authorKind === "system" ? (
          <SystemLine key={entry.key} message={entry.message} />
        ) : (
          <MessageBubble
            key={entry.key}
            message={entry.message}
            employeeName={employeeName}
            highlightQuery={focus.highlightQuery}
            isActive={entry.message.id === focus.activeMessageId}
            isDecisionOpen={entry.message.id === focus.decisionMessageId}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
