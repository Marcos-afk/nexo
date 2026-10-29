import { cx } from "class-variance-authority";
import Link from "next/link";
import type { NavItemViewProps } from "@/models/navigation";
import { NavIcon } from "./nav-icon";

interface NavLinkProps {
  readonly item: NavItemViewProps;
}

export function NavLink({ item }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      aria-current={item.isActive ? "page" : undefined}
      className={cx(
        "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition",
        item.isActive
          ? "bg-primary-soft font-semibold text-primary-text"
          : "font-medium text-ink-2 hover:bg-card",
      )}
    >
      <NavIcon name={item.icon} />
      {item.label}
    </Link>
  );
}
