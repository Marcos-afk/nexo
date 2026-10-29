"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import {
  CLOSE_SEARCH_LABEL,
  NEXT_MATCH_LABEL,
  NO_MATCHES_LABEL,
  PREVIOUS_MATCH_LABEL,
  SEARCH_CONVERSATION_PLACEHOLDER,
  searchPositionOf,
} from "@/constants/console";

const ICON_SIZE = 16;
const ICON_BUTTON_CLASSES =
  "flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-3 hover:bg-card hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";

interface SearchButtonsProps {
  readonly hasMatches: boolean;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
  readonly onClose: () => void;
}

function SearchButtons({ hasMatches, onNext, onPrevious, onClose }: SearchButtonsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onPrevious}
        disabled={!hasMatches}
        aria-label={PREVIOUS_MATCH_LABEL}
        className={ICON_BUTTON_CLASSES}
      >
        <ChevronUp size={ICON_SIZE} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasMatches}
        aria-label={NEXT_MATCH_LABEL}
        className={ICON_BUTTON_CLASSES}
      >
        <ChevronDown size={ICON_SIZE} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={CLOSE_SEARCH_LABEL}
        className={ICON_BUTTON_CLASSES}
      >
        <X size={ICON_SIZE} aria-hidden="true" />
      </button>
    </>
  );
}

interface ConversationSearchProps {
  readonly query: string;
  readonly position: number;
  readonly total: number;
  readonly onQueryChange: (value: string) => void;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
  readonly onClose: () => void;
}

export function ConversationSearch({
  query,
  position,
  total,
  onQueryChange,
  onNext,
  onPrevious,
  onClose,
}: ConversationSearchProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      onClose();

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      (event.shiftKey ? onPrevious : onNext)();
    }
  };

  return (
    <search className="flex items-center gap-2 border-b border-rule bg-desk px-6 py-2">
      <Search size={ICON_SIZE} aria-hidden="true" className="shrink-0 text-ink-3" />
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={SEARCH_CONVERSATION_PLACEHOLDER}
        aria-label={SEARCH_CONVERSATION_PLACEHOLDER}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
      />
      {query.trim() !== "" && (
        <span aria-live="polite" className="text-xs text-ink-3">
          {total === 0 ? NO_MATCHES_LABEL : searchPositionOf(position, total)}
        </span>
      )}
      <SearchButtons
        hasMatches={total > 0}
        onNext={onNext}
        onPrevious={onPrevious}
        onClose={onClose}
      />
    </search>
  );
}
