import { EMPTY_PANE_HINT, EMPTY_PANE_TITLE } from "@/constants/console";

export default function ConsoleEmptyPane() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 bg-desk px-6 text-center">
      <p className="text-sm font-semibold text-ink">{EMPTY_PANE_TITLE}</p>
      <p className="text-xs text-ink-3">{EMPTY_PANE_HINT}</p>
    </div>
  );
}
