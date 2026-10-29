import { cx } from "class-variance-authority";
import type { HTMLAttributes } from "react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cx("animate-pulse rounded-md border border-rule bg-card", className)}
      {...props}
    />
  );
}
