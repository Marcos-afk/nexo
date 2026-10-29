"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { AssistantStatus } from "@/domain/health";
import { useAssistantStatus } from "@/viewmodels/use-assistant-status";

interface AssistantStatusContextValue {
  readonly status: AssistantStatus | null;
}

interface AssistantStatusProviderProps {
  readonly initialStatus: AssistantStatus;
  readonly children: ReactNode;
}

const AssistantStatusContext = createContext<AssistantStatusContextValue | null>(null);

export function AssistantStatusProvider({ initialStatus, children }: AssistantStatusProviderProps) {
  const { status } = useAssistantStatus(initialStatus);

  return <AssistantStatusContext value={{ status }}>{children}</AssistantStatusContext>;
}

export function useAssistantStatusContext(): AssistantStatusContextValue {
  const context = useContext(AssistantStatusContext);

  if (!context) {
    throw new Error("useAssistantStatusContext deve ser usado dentro de AssistantStatusProvider");
  }

  return context;
}
