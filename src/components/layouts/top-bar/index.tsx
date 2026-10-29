"use client";

import { ChevronRight } from "lucide-react";
import { BREADCRUMB_ROOT } from "@/constants/navigation";
import { useAssistantStatusContext } from "@/providers/assistant-status-provider";
import { useNavigation } from "@/viewmodels/use-navigation";
import { AssistantStatusBadge } from "./assistant-status";

const SEPARATOR_SIZE = 14;

export function TopBar() {
  const { current } = useNavigation();
  const { status } = useAssistantStatusContext();

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-rule px-8">
      <nav aria-label="Você está em" className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <span className="text-ink-3">{BREADCRUMB_ROOT}</span>
        <ChevronRight size={SEPARATOR_SIZE} aria-hidden="true" className="shrink-0 text-ink-3" />
        <span aria-current="page" className="font-semibold text-ink">
          {current.label}
        </span>
      </nav>
      {status && <AssistantStatusBadge status={status} />}
    </header>
  );
}
