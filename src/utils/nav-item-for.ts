import { NAV_ITEMS, SUPPORT_NAV_ITEM } from "@/constants/navigation";
import type { NavItemProps } from "@/models/navigation";

const ROOT_PATH = "/";

const isCurrentPath = (pathname: string, href: string): boolean =>
  href === ROOT_PATH
    ? pathname === ROOT_PATH
    : pathname === href || pathname.startsWith(`${href}/`);

export const navItemFor = (pathname: string): NavItemProps =>
  NAV_ITEMS.find((item) => isCurrentPath(pathname, item.href)) ?? SUPPORT_NAV_ITEM;
