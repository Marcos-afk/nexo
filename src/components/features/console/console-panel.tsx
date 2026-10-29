"use client";

import { CONSOLE_TITLE, EMPTY_PANE_HINT, EMPTY_PANE_TITLE } from "@/constants/console";
import type { ConsoleProps } from "@/models/console";
import { useConsole } from "@/viewmodels/use-console";
import { useConsoleAvailability } from "@/viewmodels/use-console-availability";
import { useNow } from "@/viewmodels/use-now";
import { AvailabilityToggle } from "./availability-toggle";
import { ConversationList } from "./conversation-list";
import { FilterTabs } from "./filter-tabs";
import { SearchBox } from "./search-box";

interface ConsolePanelProps {
  readonly initial: ConsoleProps;
}

export function ConsolePanel({ initial }: ConsolePanelProps) {
  const { overview, error, filter, query, isSearching, onFilterChange, onQueryChange } =
    useConsole(initial);
  const { availability, isSaving, onToggle } = useConsoleAvailability(initial.me.availability);
  const now = useNow();

  return (
    <div className="flex h-full">
      <section
        aria-label={CONSOLE_TITLE}
        className="flex w-95 shrink-0 flex-col overflow-hidden border-r border-rule"
      >
        <header className="flex flex-col gap-3 px-4 pt-4 pb-2.5">
          <div className="flex items-center gap-2">
            <h1 className="flex-1 text-xl font-bold tracking-tight text-ink">{CONSOLE_TITLE}</h1>
            <AvailabilityToggle
              availability={availability}
              isSaving={isSaving}
              onToggle={onToggle}
            />
          </div>
          <SearchBox value={query} onChange={onQueryChange} />
          <FilterTabs active={filter} counts={overview.counts} onChange={onFilterChange} />
          {error && (
            <p role="alert" className="text-xs text-danger-text">
              {error}
            </p>
          )}
        </header>
        <ConversationList items={overview.items} isSearching={isSearching} now={now} />
      </section>
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 bg-desk px-6 text-center">
        <p className="text-sm font-semibold text-ink">{EMPTY_PANE_TITLE}</p>
        <p className="text-xs text-ink-3">{EMPTY_PANE_HINT}</p>
      </div>
    </div>
  );
}
