import { cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import type { BadgeToneType } from "@/models/ticket";

interface BadgeRootProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeToneType;
}

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-card text-ink-2",
        info: "bg-primary-soft text-primary-text",
        success: "bg-success-soft text-success-text",
        warning: "bg-warning-soft text-warning-text",
        danger: "bg-danger-soft text-danger-text",
        violet: "bg-violet-soft text-violet-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

function Root({ className, tone, ...props }: BadgeRootProps) {
  return <span data-slot="badge-root" className={badgeVariants({ tone, className })} {...props} />;
}

export const Badge = { Root };
