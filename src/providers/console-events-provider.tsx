"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { EVENTS_ENDPOINT } from "@/constants/chat";

const REALTIME_EVENTS = [
  "message.created",
  "conversation.updated",
  "presence.changed",
  "resync",
] as const;

type EventListener = (raw: unknown) => void;

interface ConsoleEventsContextValue {
  readonly subscribe: (listener: EventListener) => () => void;
}

interface ConsoleEventsProviderProps {
  readonly children: ReactNode;
}

const ConsoleEventsContext = createContext<ConsoleEventsContextValue | null>(null);

export function ConsoleEventsProvider({ children }: ConsoleEventsProviderProps) {
  const [listeners] = useState(() => new Set<EventListener>());
  const [value] = useState<ConsoleEventsContextValue>(() => ({
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  }));

  useEffect(() => {
    const source = new EventSource(EVENTS_ENDPOINT);
    const dispatch = (event: MessageEvent) => {
      for (const listener of listeners) {
        listener(event.data);
      }
    };

    for (const type of REALTIME_EVENTS) {
      source.addEventListener(type, dispatch);
    }

    return () => source.close();
  }, [listeners]);

  return <ConsoleEventsContext value={value}>{children}</ConsoleEventsContext>;
}

export function useConsoleEventsContext(): ConsoleEventsContextValue {
  const context = useContext(ConsoleEventsContext);

  if (!context) {
    throw new Error("useConsoleEventsContext deve ser usado dentro de ConsoleEventsProvider");
  }

  return context;
}
