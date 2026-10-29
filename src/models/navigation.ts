export type NavIconNameType = "message-square" | "user-round";

export interface NavItemProps {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly icon: NavIconNameType;
}

export interface NavItemViewProps extends NavItemProps {
  readonly isActive: boolean;
}
