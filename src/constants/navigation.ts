import type { NavItemProps } from "@/models/navigation";

export const SUPPORT_NAV_ITEM: NavItemProps = {
  key: "support",
  label: "Atendimento",
  href: "/",
  icon: "message-square",
};

export const PROFILE_NAV_ITEM: NavItemProps = {
  key: "profile",
  label: "Meu perfil",
  href: "/perfil",
  icon: "user-round",
};

export const NAV_ITEMS: readonly NavItemProps[] = [SUPPORT_NAV_ITEM, PROFILE_NAV_ITEM];

export const BREADCRUMB_ROOT = "Service desk de TI";
