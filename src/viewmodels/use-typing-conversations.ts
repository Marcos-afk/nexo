import { useSyncExternalStore } from "react";
import { useConsoleEventsContext } from "@/providers/console-events-provider";

const NO_CONVERSATIONS: ReadonlySet<string> = new Set();

export function useTypingConversations(): ReadonlySet<string> {
  const { typing } = useConsoleEventsContext();

  return useSyncExternalStore(typing.subscribe, typing.snapshot, () => NO_CONVERSATIONS);
}
