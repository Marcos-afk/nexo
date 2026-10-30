export interface TypingStore {
  readonly mark: (conversationId: string) => void;
  readonly clear: (conversationId: string) => void;
  readonly subscribe: (listener: () => void) => () => void;
  readonly snapshot: () => ReadonlySet<string>;
  readonly dispose: () => void;
}

const createSubscribers = () => {
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const emit = (): void => {
    for (const listener of [...listeners]) {
      listener();
    }
  };

  return { subscribe, emit };
};

export const createTypingStore = (expiryMs: number): TypingStore => {
  const emptySnapshot: ReadonlySet<string> = new Set();
  const state = { typing: emptySnapshot };
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const { subscribe, emit } = createSubscribers();

  const stopTimer = (conversationId: string): void => {
    clearTimeout(timers.get(conversationId));
    timers.delete(conversationId);
  };

  const clear = (conversationId: string): void => {
    stopTimer(conversationId);

    if (!state.typing.has(conversationId)) {
      return;
    }

    state.typing = new Set([...state.typing].filter((id) => id !== conversationId));
    emit();
  };

  const mark = (conversationId: string): void => {
    stopTimer(conversationId);
    timers.set(
      conversationId,
      setTimeout(() => clear(conversationId), expiryMs),
    );

    if (state.typing.has(conversationId)) {
      return;
    }

    state.typing = new Set([...state.typing, conversationId]);
    emit();
  };

  const dispose = (): void => {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }

    timers.clear();
  };

  return { mark, clear, subscribe, snapshot: () => state.typing, dispose };
};
