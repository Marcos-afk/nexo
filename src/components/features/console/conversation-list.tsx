import {
  EMPTY_LIST_FILTER_HINT,
  EMPTY_LIST_SEARCH_HINT,
  EMPTY_LIST_TITLE,
} from "@/constants/console";
import type { ConsoleItemProps } from "@/models/console";
import { ConversationItem } from "./conversation-item";

interface ConversationListProps {
  readonly items: readonly ConsoleItemProps[];
  readonly isSearching: boolean;
  readonly now: Date | null;
}

export function ConversationList({ items, isSearching, now }: ConversationListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 text-center">
        <p className="text-sm font-semibold text-ink">{EMPTY_LIST_TITLE}</p>
        <p className="text-xs text-ink-3">
          {isSearching ? EMPTY_LIST_SEARCH_HINT : EMPTY_LIST_FILTER_HINT}
        </p>
      </div>
    );
  }

  return (
    <ul aria-label="Conversas" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
      {items.map((item) => (
        <ConversationItem key={item.id} item={item} now={now} />
      ))}
    </ul>
  );
}
