import { cx } from "class-variance-authority";
import { FILTER_COUNT_KEYS, FILTER_LABELS } from "@/constants/console";
import { type ConsoleFilter, consoleFilters } from "@/domain/console";
import type { ConsoleCountsProps } from "@/models/console";

interface FilterTabsProps {
  readonly active: ConsoleFilter;
  readonly counts: ConsoleCountsProps;
  readonly onChange: (filter: ConsoleFilter) => void;
}

export function FilterTabs({ active, counts, onChange }: FilterTabsProps) {
  return (
    <fieldset className="flex flex-wrap gap-1">
      <legend className="sr-only">Filtrar conversas</legend>
      {consoleFilters.map((filter) => {
        const isActive = filter === active;

        return (
          <button
            key={filter}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(filter)}
            className={cx(
              "flex cursor-pointer items-center gap-1.5 rounded-full px-2.25 py-1.5 text-xs font-medium transition",
              isActive ? "bg-primary-soft text-primary-text" : "bg-desk text-ink-2 hover:bg-card",
            )}
          >
            {FILTER_LABELS[filter]}
            <span className={cx("font-semibold", isActive ? "text-primary-text" : "text-ink-3")}>
              {counts[FILTER_COUNT_KEYS[filter]]}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
