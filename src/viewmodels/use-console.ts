import { useEffect, useEffectEvent, useState } from "react";
import { CONSOLE_ENDPOINT, LIST_LOAD_ERROR, SEARCH_DEBOUNCE_MS } from "@/constants/console";
import type { ConsoleFilter } from "@/domain/console";
import { api } from "@/lib/api";
import type { ConsoleProps } from "@/models/console";
import { useConsoleState } from "@/providers/console-state-provider";
import { consoleResponseSchema } from "@/schemas/console";
import { errorMessageOf } from "@/utils/error-message";
import { useConsoleEvents } from "./use-console-events";
import { useDebouncedValue } from "./use-debounced-value";

const consolePathOf = (filter: ConsoleFilter, query: string): string =>
  `${CONSOLE_ENDPOINT}?${new URLSearchParams({ filter, q: query })}`;

function useConsoleData(initial: ConsoleProps, filter: ConsoleFilter, query: string) {
  const { setAttention } = useConsoleState();
  const [overview, setOverview] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const refresh = useEffectEvent(
    async (nextFilter: ConsoleFilter, nextQuery: string, signal?: AbortSignal) => {
      try {
        const next = await api.get(
          consolePathOf(nextFilter, nextQuery),
          consoleResponseSchema,
          signal,
        );

        setOverview(next);
        setAttention(next.attention);
        setError(null);
      } catch (cause) {
        if (!signal?.aborted) {
          setError(errorMessageOf(cause, LIST_LOAD_ERROR));
        }
      }
    },
  );

  useConsoleEvents(() => void refresh(filter, query));

  useEffect(() => {
    const controller = new AbortController();

    void refresh(filter, query, controller.signal);

    return () => controller.abort();
  }, [filter, query]);

  return { overview, error };
}

export function useConsole(initial: ConsoleProps) {
  const [filter, setFilter] = useState<ConsoleFilter>("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const { overview, error } = useConsoleData(initial, filter, debouncedQuery);

  return {
    overview,
    error,
    filter,
    query,
    isSearching: debouncedQuery !== "",
    onFilterChange: setFilter,
    onQueryChange: setQuery,
  };
}
