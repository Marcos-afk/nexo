import type { EventPublisher, RealtimeEvent } from "@/domain/realtime";

export interface EventRecorder extends EventPublisher {
  readonly events: readonly RealtimeEvent[];
}

export const createEventRecorder = (): EventRecorder => {
  const events: RealtimeEvent[] = [];

  return {
    events,
    publish: (event) => {
      events.push(event);
    },
  };
};
