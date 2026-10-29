export interface BusEntry<TEvent> {
  readonly id: number;
  readonly event: TEvent;
}

export type Replay<TEvent> =
  | { readonly resync: true }
  | { readonly resync: false; readonly entries: readonly BusEntry<TEvent>[] };

export interface EventBus<TEvent> {
  readonly publish: (event: TEvent) => number;
  readonly subscribe: (listener: (entry: BusEntry<TEvent>) => void) => () => void;
  readonly replay: (lastId: number) => Replay<TEvent>;
}

export const createEventBus = <TEvent>(capacity: number): EventBus<TEvent> => {
  const state = { lastId: 0, buffer: [] as readonly BusEntry<TEvent>[] };
  const listeners = new Set<(entry: BusEntry<TEvent>) => void>();

  const publish = (event: TEvent): number => {
    const entry: BusEntry<TEvent> = { id: state.lastId + 1, event };

    state.lastId = entry.id;
    state.buffer = [...state.buffer, entry].slice(-capacity);
    for (const listener of [...listeners]) {
      listener(entry);
    }

    return entry.id;
  };

  const subscribe = (listener: (entry: BusEntry<TEvent>) => void): (() => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const replay = (lastId: number): Replay<TEvent> => {
    const oldestKept = state.buffer[0]?.id ?? state.lastId + 1;

    if (lastId > state.lastId || lastId < oldestKept - 1) {
      return { resync: true };
    }

    return { resync: false, entries: state.buffer.filter((entry) => entry.id > lastId) };
  };

  return { publish, subscribe, replay };
};
