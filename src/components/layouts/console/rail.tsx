"use client";

import { Loader2, LogOut, MessageCircle } from "lucide-react";
import { NexoMark } from "@/components/ui/nexo-mark";
import type { ConsoleMeProps } from "@/models/console";
import { useConsoleState } from "@/providers/console-state-provider";
import { getUserAcronym } from "@/utils/get-user-acronym";
import { useSignOut } from "@/viewmodels/use-sign-out";

const ICON_SIZE = 19;
const SIGN_OUT_ICON_SIZE = 17;

interface RailProps {
  readonly me: Pick<ConsoleMeProps, "name">;
}

export function Rail({ me }: RailProps) {
  const { attention } = useConsoleState();
  const { isSigningOut, onSignOut } = useSignOut();

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-1.5 bg-desk py-4">
      <span className="flex size-10 items-center justify-center pb-2">
        <NexoMark className="text-primary" width={22} height={19} />
      </span>
      <nav aria-label="Principal">
        <span
          role="img"
          aria-label={`Conversas, ${attention} precisam de atenção`}
          className="relative flex size-10 items-center justify-center rounded-xl bg-paper text-ink shadow-[0_1px_2px_#1b24311a]"
        >
          <MessageCircle size={ICON_SIZE} aria-hidden="true" />
          {attention > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1 left-6 flex h-4 items-center justify-center rounded-full bg-cta px-1.25 text-[10px] font-bold text-white ring-2 ring-desk"
            >
              {attention}
            </span>
          )}
        </span>
      </nav>
      <div className="mt-auto flex flex-col items-center gap-2">
        <span
          title={me.name}
          className="relative flex size-9 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-text"
        >
          {getUserAcronym(me.name)}
          <span
            aria-hidden="true"
            className="absolute right-0 bottom-0 size-2.5 rounded-full bg-success ring-2 ring-desk"
          />
        </span>
        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          aria-label="Sair"
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition hover:bg-card hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningOut ? (
            <Loader2 size={SIGN_OUT_ICON_SIZE} className="animate-spin" />
          ) : (
            <LogOut size={SIGN_OUT_ICON_SIZE} />
          )}
        </button>
      </div>
    </aside>
  );
}
