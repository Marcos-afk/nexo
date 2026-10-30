import { describe, expect, it } from "vitest";
import type { Clock } from "../../src/lib/clock";
import {
  createTypingSignal,
  TYPING_THROTTLE_MS,
} from "../../src/services/conversations/typing-signal";
import { createSeededDatabase } from "../support/database";
import { createEventRecorder } from "../support/event-recorder";
import { createSequentialIds } from "../support/ids";

const START = new Date("2026-10-28T13:00:00.000Z").getTime();
const CARLA = "emp-carla";
const CARLA_CHAT = "c-carla";
const FABIO = "emp-fabio";

const createSignal = async () => {
  const state = { now: START };
  const clock: Clock = { now: () => new Date(state.now) };
  const recorder = createEventRecorder();
  const { signal } = createTypingSignal({
    database: await createSeededDatabase(),
    clock,
    ids: createSequentialIds("new"),
    events: recorder,
  });

  const advance = (ms: number): void => {
    state.now += ms;
  };

  return { signal, recorder, advance };
};

describe("typing signal", () => {
  it("announces that the employee is typing in the active conversation", async () => {
    const { signal, recorder } = await createSignal();

    await signal(CARLA);

    expect(recorder.events).toEqual([
      {
        type: "typing.started",
        conversationId: CARLA_CHAT,
        ownerId: CARLA,
        at: "2026-10-28T13:00:00.000Z",
      },
    ]);
  });

  it("publishes nothing when the employee has no active conversation", async () => {
    const { signal, recorder } = await createSignal();

    await signal(FABIO);

    expect(recorder.events).toHaveLength(0);
  });

  it.each([
    { name: "just before the interval", elapsed: TYPING_THROTTLE_MS - 1, published: 1 },
    { name: "exactly at the interval", elapsed: TYPING_THROTTLE_MS, published: 2 },
  ])("throttles repeated signals $name", async ({ elapsed, published }) => {
    const { signal, recorder, advance } = await createSignal();

    await signal(CARLA);
    advance(elapsed);
    await signal(CARLA);

    expect(recorder.events).toHaveLength(published);
  });
});
