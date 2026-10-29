import { type EventAudience, isVisibleTo, type RealtimeEvent } from "../domain/realtime";
import type { BusEntry, EventBus } from "../lib/event-bus";
import type { PresenceTracker } from "./presence";

export const HEARTBEAT_INTERVAL_MS = 15_000;
export const RETRY_INTERVAL_MS = 3000;

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
} as const;

export interface EventStreamOptions {
  readonly bus: EventBus<RealtimeEvent>;
  readonly audience: EventAudience;
  readonly lastEventId: number | null;
  readonly signal: AbortSignal;
  readonly presence?: Pick<PresenceTracker, "connect">;
}

const encoder = new TextEncoder();

export const formatEvent = (name: string, data: unknown, id?: number): string => {
  const idLine = id === undefined ? "" : `id: ${id}\n`;

  return `${idLine}event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
};

const retryFrame = `retry: ${RETRY_INTERVAL_MS}\n\n`;
const heartbeatFrame = ": heartbeat\n\n";

export const parseLastEventId = (header: string | null): number | null => {
  if (header === null) {
    return null;
  }

  const parsed = Number(header);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

const frameOf = ({ id, event }: BusEntry<RealtimeEvent>): string =>
  formatEvent(event.type, event, id);

interface Subscription {
  readonly stop: () => boolean;
}

const replayMissed = (
  { bus, lastEventId }: EventStreamOptions,
  send: (frame: string) => void,
  sendEntry: (entry: BusEntry<RealtimeEvent>) => void,
): void => {
  if (lastEventId === null) {
    return;
  }

  const replay = bus.replay(lastEventId);

  if (replay.resync) {
    send(formatEvent("resync", {}));

    return;
  }

  replay.entries.forEach(sendEntry);
};

const openSubscription = (
  options: EventStreamOptions,
  controller: ReadableStreamDefaultController<Uint8Array>,
): Subscription => {
  const state = { closed: false };

  const send = (frame: string): void => {
    if (!state.closed) {
      controller.enqueue(encoder.encode(frame));
    }
  };

  const sendEntry = (entry: BusEntry<RealtimeEvent>): void => {
    if (isVisibleTo(entry.event, options.audience)) {
      send(frameOf(entry));
    }
  };

  const heartbeat = setInterval(() => send(heartbeatFrame), HEARTBEAT_INTERVAL_MS);
  const unsubscribe = options.bus.subscribe(sendEntry);
  const disconnect = options.presence?.connect(options.audience.id);

  const stop = (): boolean => {
    if (state.closed) {
      return false;
    }

    state.closed = true;
    clearInterval(heartbeat);
    unsubscribe();
    disconnect?.();

    return true;
  };

  send(retryFrame);
  send(formatEvent("ready", {}));
  replayMissed(options, send, sendEntry);

  return { stop };
};

export const createEventStream = (options: EventStreamOptions): ReadableStream<Uint8Array> => {
  const held: { subscription?: Subscription } = {};

  return new ReadableStream<Uint8Array>({
    start(controller) {
      if (options.signal.aborted) {
        controller.close();

        return;
      }

      const subscription = openSubscription(options, controller);
      const closeOnAbort = (): void => {
        if (subscription.stop()) {
          controller.close();
        }
      };

      held.subscription = subscription;
      options.signal.addEventListener("abort", closeOnAbort, { once: true });
    },
    cancel() {
      held.subscription?.stop();
    },
  });
};
