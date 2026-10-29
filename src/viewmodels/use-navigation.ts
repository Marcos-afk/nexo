import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants/navigation";
import type { NavItemViewProps } from "@/models/navigation";
import { navItemFor } from "@/utils/nav-item-for";

export function useNavigation() {
  const current = navItemFor(usePathname());

  const items: NavItemViewProps[] = NAV_ITEMS.map((item) => ({
    ...item,
    isActive: item.key === current.key,
  }));

  return { items, current };
}
