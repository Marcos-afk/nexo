import { useState } from "react";
import type { ConsoleMessageProps } from "@/models/console";
import { matchingMessageIds } from "@/utils/console-conversation";

const FIRST_MATCH = 0;

export function useConversationSearch(messages: readonly ConsoleMessageProps[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQueryState] = useState("");
  const [activeIndex, setActiveIndex] = useState(FIRST_MATCH);
  const matches = matchingMessageIds(messages, query);
  const total = matches.length;
  const safeIndex = total === 0 ? FIRST_MATCH : Math.min(activeIndex, total - 1);

  return {
    isOpen,
    query,
    total,
    position: total === 0 ? 0 : safeIndex + 1,
    activeMessageId: isOpen ? (matches[safeIndex] ?? null) : null,
    highlightQuery: isOpen ? query : "",
    onOpen: () => setIsOpen(true),
    onClose: () => {
      setIsOpen(false);
      setQueryState("");
      setActiveIndex(FIRST_MATCH);
    },
    onQueryChange: (value: string) => {
      setQueryState(value);
      setActiveIndex(FIRST_MATCH);
    },
    onNext: () => setActiveIndex(total === 0 ? FIRST_MATCH : (safeIndex + 1) % total),
    onPrevious: () => setActiveIndex(total === 0 ? FIRST_MATCH : (safeIndex - 1 + total) % total),
  };
}
