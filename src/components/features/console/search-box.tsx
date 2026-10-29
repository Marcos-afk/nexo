import { Search } from "lucide-react";
import { SEARCH_PLACEHOLDER } from "@/constants/console";

const ICON_SIZE = 15;

interface SearchBoxProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <label className="flex h-9 items-center gap-2.5 rounded-full bg-desk px-3 focus-within:ring-2 focus-within:ring-primary">
      <Search size={ICON_SIZE} aria-hidden="true" className="shrink-0 text-ink-3" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label={SEARCH_PLACEHOLDER}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
      />
    </label>
  );
}
