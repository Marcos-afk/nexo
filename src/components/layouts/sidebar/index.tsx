"use client";

import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexoMark } from "@/components/ui/nexo-mark";
import type { AuthUserProps } from "@/models/auth";
import { useNavigation } from "@/viewmodels/use-navigation";
import { useSignOut } from "@/viewmodels/use-sign-out";
import { NavLink } from "./nav-link";
import { UserCard } from "./user-card";

const ICON_SIZE = 18;

interface SidebarProps {
  readonly user: AuthUserProps | null;
}

export function Sidebar({ user }: SidebarProps) {
  const { items } = useNavigation();
  const { isSigningOut, onSignOut } = useSignOut();

  return (
    <aside className="flex w-58 shrink-0 flex-col border-r border-rule px-3.5 pt-5 pb-3.5">
      <div className="flex items-center gap-2.5 px-2 text-ink">
        <NexoMark className="text-primary" />
        <span className="text-base font-bold tracking-tight">Nexo Assist</span>
      </div>

      <nav aria-label="Principal" className="mt-5.5 flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink key={item.key} item={item} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col">
        {user && <UserCard user={user} />}
        <Button.Root
          variant="ghost"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="mt-1 h-8.5 w-full justify-start rounded-lg px-2.5 font-medium"
        >
          {isSigningOut ? (
            <Loader2 size={ICON_SIZE} className="animate-spin" />
          ) : (
            <LogOut size={ICON_SIZE} />
          )}
          Sair
        </Button.Root>
      </div>
    </aside>
  );
}
