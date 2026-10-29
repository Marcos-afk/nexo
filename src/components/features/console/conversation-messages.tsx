"use client";

import { useEffect, useRef } from "react";
import type { ConsoleMessageProps } from "@/models/console";
import { toEntries } from "@/utils/console-conversation";
import { useNow } from "@/viewmodels/use-now";
import { MessageBubble, SystemLine } from "./message-bubble";

interface ConversationMessagesProps {
  readonly messages: readonly ConsoleMessageProps[];
  readonly employeeName: string;
}

export function ConversationMessages({ messages, employeeName }: ConversationMessagesProps) {
  const now = useNow();
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  useEffect(() => {
    if (lastId !== undefined) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [lastId]);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
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
          <MessageBubble key={entry.key} message={entry.message} employeeName={employeeName} />
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
