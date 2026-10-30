"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { EVENTS_ENDPOINT } from "@/constants/chat";
import { TYPING_EXPIRY_MS } from "@/constants/console";
import { createTypingStore, type TypingStore } from "@/lib/typing-store";
import { eventSignalSchema, messageEventSchema } from "@/schemas/console";
import { parseEventData } from "@/utils/parse-event";

const EMPLOYEE_AUTHOR = "employee";

type EventListener = (raw: unknown) => void;

interface ConsoleEventsContextValue {
  readonly subscribe: (listener: EventListener) => () => void;
  readonly typing: TypingStore;
}

interface ConsoleEventsProviderProps {
  readonly children: ReactNode;
}

const ConsoleEventsContext = createContext<ConsoleEventsContextValue | null>(null);

const connectEvents = (listeners: ReadonlySet<EventListener>, typing: TypingStore) => {
  const source = new EventSource(EVENTS_ENDPOINT);
  const forward = (event: MessageEvent) => {
    for (const listener of listeners) {
      listener(event.data);
    }
  };
  const onMessage = (event: MessageEvent) => {
    const data = parseEventData(event.data, messageEventSchema);

    if (data?.authorKind === EMPLOYEE_AUTHOR) {
      typing.clear(data.conversationId);
    }

    forward(event);
  };
  const onTyping = (event: MessageEvent) => {
    const data = parseEventData(event.data, eventSignalSchema);

    if (data) {
      typing.mark(data.conversationId);
    }
  };
  const handlerByEvent: Record<string, (event: MessageEvent) => void> = {
    "message.created": onMessage,
    "conversation.updated": forward,
    "presence.changed": forward,
    resync: forward,
    "typing.started": onTyping,
  };

  for (const [type, handler] of Object.entries(handlerByEvent)) {
    source.addEventListener(type, handler);
  }

  return () => {
    source.close();
    typing.dispose();
  };
};

export function ConsoleEventsProvider({ children }: ConsoleEventsProviderProps) {
  const [listeners] = useState(() => new Set<EventListener>());
  const [typing] = useState(() => createTypingStore(TYPING_EXPIRY_MS));
  const [value] = useState<ConsoleEventsContextValue>(() => ({
    typing,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  }));

  useEffect(() => connectEvents(listeners, typing), [listeners, typing]);

  return <ConsoleEventsContext value={value}>{children}</ConsoleEventsContext>;
}

export function useConsoleEventsContext(): ConsoleEventsContextValue {
  const context = useContext(ConsoleEventsContext);

  if (!context) {
    throw new Error("useConsoleEventsContext deve ser usado dentro de ConsoleEventsProvider");
  }

  return context;
}
