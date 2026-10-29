import { MessageSquare, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { NavIconNameType } from "@/models/navigation";

const ICON_SIZE = 18;

const NAV_ICONS = {
  "message-square": <MessageSquare size={ICON_SIZE} />,
  "user-round": <UserRound size={ICON_SIZE} />,
} as const satisfies Record<NavIconNameType, ReactNode>;

interface NavIconProps {
  readonly name: NavIconNameType;
}

export function NavIcon({ name }: NavIconProps) {
  return NAV_ICONS[name];
}
