import { cx } from "class-variance-authority";
import { AVAILABILITY_LABELS } from "@/constants/console";
import type { AnalystAvailability } from "@/domain/console";

interface AvailabilityToggleProps {
  readonly availability: AnalystAvailability;
  readonly isSaving: boolean;
  readonly onToggle: () => void;
}

export function AvailabilityToggle({ availability, isSaving, onToggle }: AvailabilityToggleProps) {
  const isOnline = availability === "online";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isSaving}
      aria-pressed={isOnline}
      className={cx(
        "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.25 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        isOnline ? "bg-success-soft text-success-text" : "bg-card text-ink-3",
      )}
    >
      <span
        aria-hidden="true"
        className={cx("size-1.75 rounded-full", isOnline ? "bg-success" : "bg-subtle")}
      />
      {AVAILABILITY_LABELS[availability]}
    </button>
  );
}
