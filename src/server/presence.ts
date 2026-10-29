import type { EventPublisher } from "../domain/realtime";
import type { Clock } from "../lib/clock";

export interface PresenceTracker {
  readonly connect: (userId: string) => () => void;
  readonly isOnline: (userId: string) => boolean;
}

interface PresenceDeps {
  readonly events: EventPublisher;
  readonly clock: Clock;
}

export const createPresenceTracker = ({ events, clock }: PresenceDeps): PresenceTracker => {
  const connections = new Map<string, number>();

  const announce = (userId: string, online: boolean): void =>
    events.publish({
      type: "presence.changed",
      ownerId: userId,
      online,
      at: clock.now().toISOString(),
    });

  const connect = (userId: string): (() => void) => {
    const before = connections.get(userId) ?? 0;

    connections.set(userId, before + 1);

    if (before === 0) {
      announce(userId, true);
    }

    const state = { released: false };

    return () => {
      if (state.released) {
        return;
      }

      state.released = true;

      const remaining = (connections.get(userId) ?? 1) - 1;

      if (remaining > 0) {
        connections.set(userId, remaining);

        return;
      }

      connections.delete(userId);
      announce(userId, false);
    };
  };

  return { connect, isOnline: (userId) => (connections.get(userId) ?? 0) > 0 };
};
