import { cx } from "class-variance-authority";
import { ASSISTANT_STATUS_LABELS } from "@/constants/health";
import type { AssistantStatus } from "@/domain/health";

interface AssistantStatusProps {
  readonly status: AssistantStatus;
}

const STATUS_CLASSES = {
  online: { badge: "bg-success-soft", dot: "bg-success", label: "text-success-text" },
  degraded: { badge: "bg-warning-soft", dot: "bg-warning", label: "text-warning-text" },
  offline: { badge: "bg-danger-soft", dot: "bg-danger", label: "text-danger-text" },
} as const satisfies Record<AssistantStatus, { badge: string; dot: string; label: string }>;

export function AssistantStatusBadge({ status }: AssistantStatusProps) {
  const classes = STATUS_CLASSES[status];

  return (
    <div
      role="status"
      className={cx("flex items-center gap-1.75 rounded-full px-2.5 py-1.25", classes.badge)}
    >
      <span aria-hidden="true" className={cx("size-1.75 rounded-full", classes.dot)} />
      <span className={cx("text-xs font-semibold", classes.label)}>
        {ASSISTANT_STATUS_LABELS[status]}
      </span>
    </div>
  );
}
