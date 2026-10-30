"use client";

import { useParams } from "next/navigation";
import { CONSOLE_TITLE } from "@/constants/console";
import type { ConsoleProps } from "@/models/console";
import { useConsole } from "@/viewmodels/use-console";
import { useConsoleAvailability } from "@/viewmodels/use-console-availability";
import { useNow } from "@/viewmodels/use-now";
import { useTypingConversations } from "@/viewmodels/use-typing-conversations";
import { AvailabilityToggle } from "./availability-toggle";
import { ConversationList } from "./conversation-list";
import { FilterTabs } from "./filter-tabs";
import { SearchBox } from "./search-box";

interface ConsoleListProps {
  readonly initial: ConsoleProps;
}

export function ConsoleList({ initial }: ConsoleListProps) {
  const { overview, error, filter, query, isSearching, onFilterChange, onQueryChange } =
    useConsole(initial);
  const { availability, isSaving, onToggle } = useConsoleAvailability(initial.me.availability);
  const { id: selectedId } = useParams<{ id?: string }>();
  const now = useNow();
  const typingIds = useTypingConversations();

  return (
    <section
      aria-label={CONSOLE_TITLE}
      className="flex w-95 shrink-0 flex-col overflow-hidden border-r border-rule"
    >
      <header className="flex flex-col gap-3 px-4 pt-4 pb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="flex-1 text-xl font-bold tracking-tight text-ink">{CONSOLE_TITLE}</h2>
          <AvailabilityToggle availability={availability} isSaving={isSaving} onToggle={onToggle} />
        </div>
        <SearchBox value={query} onChange={onQueryChange} />
        <FilterTabs active={filter} counts={overview.counts} onChange={onFilterChange} />
        {error && (
          <p role="alert" className="text-xs text-danger-text">
            {error}
          </p>
        )}
      </header>
      <ConversationList
        items={overview.items}
        isSearching={isSearching}
        selectedId={selectedId ?? null}
        typingIds={typingIds}
        now={now}
      />
    </section>
  );
}
