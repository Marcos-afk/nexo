"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

interface ConsoleStateContextValue {
  readonly attention: number;
  readonly setAttention: (attention: number) => void;
}

interface ConsoleStateProviderProps {
  readonly initialAttention: number;
  readonly children: ReactNode;
}

const ConsoleStateContext = createContext<ConsoleStateContextValue | null>(null);

export function ConsoleStateProvider({ initialAttention, children }: ConsoleStateProviderProps) {
  const [attention, setAttention] = useState(initialAttention);

  return <ConsoleStateContext value={{ attention, setAttention }}>{children}</ConsoleStateContext>;
}

export function useConsoleState(): ConsoleStateContextValue {
  const context = useContext(ConsoleStateContext);

  if (!context) {
    throw new Error("useConsoleState deve ser usado dentro de ConsoleStateProvider");
  }

  return context;
}
