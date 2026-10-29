import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventAudience, RealtimeEvent } from "../../src/domain/realtime";
import { createEventBus, type EventBus } from "../../src/lib/event-bus";
import {
  createEventStream,
  formatEvent,
  HEARTBEAT_INTERVAL_MS,
  parseLastEventId,
} from "../../src/server/sse";

const ANALYST: EventAudience = { id: "analyst-rafael", role: "analyst" };
const ANA: EventAudience = { id: "emp-ana", role: "employee" };
const BUFFER = 10;

const eventOf = (ownerId: string): RealtimeEvent => ({
  type: "conversation.updated",
  conversationId: `c-${ownerId}`,
  ownerId,
  at: "2026-10-28T13:00:00.000Z",
  mode: "agent",
  assignedAnalystId: null,
});

const openStream = (
  bus: EventBus<RealtimeEvent>,
  audience: EventAudience,
  lastEventId: number | null = null,
) => {
  const controller = new AbortController();
  const reader = createEventStream({
    bus,
    audience,
    lastEventId,
    signal: controller.signal,
  }).getReader();
  const decoder = new TextDecoder();
  const read = async () => decoder.decode((await reader.read()).value);

  return { controller, reader, read };
};

const skipPrelude = async (read: () => Promise<string>) => {
  await read();
  await read();
};

describe("parseLastEventId", () => {
  it.each([
    { header: null, expected: null },
    { header: "12", expected: 12 },
    { header: "0", expected: 0 },
    { header: "abc", expected: null },
    { header: "-3", expected: null },
    { header: "1.5", expected: null },
  ])("parses $header as $expected", ({ header, expected }) => {
    expect(parseLastEventId(header)).toBe(expected);
  });
});

describe("formatEvent", () => {
  it("writes id, event and JSON data lines", () => {
    expect(formatEvent("ready", { ok: true }, 4)).toBe(
      'id: 4\nevent: ready\ndata: {"ok":true}\n\n',
    );
  });

  it("omits the id line when there is no id", () => {
    expect(formatEvent("ready", {})).toBe("event: ready\ndata: {}\n\n");
  });
});

describe("event stream", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens with the retry hint and the ready event", async () => {
    const { read } = openStream(createEventBus<RealtimeEvent>(BUFFER), ANALYST);

    expect(await read()).toBe("retry: 3000\n\n");
    expect(await read()).toBe("event: ready\ndata: {}\n\n");
  });

  it("filters events by audience", async () => {
    const bus = createEventBus<RealtimeEvent>(BUFFER);
    const { read } = openStream(bus, ANA);
    await skipPrelude(read);

    bus.publish(eventOf("emp-carla"));
    bus.publish(eventOf("emp-ana"));
    const frame = await read();

    expect(frame).toContain("id: 2\n");
    expect(frame).toContain('"ownerId":"emp-ana"');
  });

  it("delivers every event to an analyst", async () => {
    const bus = createEventBus<RealtimeEvent>(BUFFER);
    const { read } = openStream(bus, ANALYST);
    await skipPrelude(read);

    bus.publish(eventOf("emp-carla"));

    expect(await read()).toContain('"ownerId":"emp-carla"');
  });

  it("replays after Last-Event-ID only what the audience can see", async () => {
    const bus = createEventBus<RealtimeEvent>(BUFFER);
    bus.publish(eventOf("emp-ana"));
    bus.publish(eventOf("emp-carla"));
    bus.publish(eventOf("emp-ana"));
    const { read } = openStream(bus, ANA, 1);
    await skipPrelude(read);

    expect(await read()).toContain("id: 3\n");
  });

  it("asks the client to resync when the buffer does not reach Last-Event-ID", async () => {
    const bus = createEventBus<RealtimeEvent>(2);
    Array.from({ length: 5 }, () => bus.publish(eventOf("emp-ana")));
    const { read } = openStream(bus, ANA, 1);
    await skipPrelude(read);

    expect(await read()).toBe("event: resync\ndata: {}\n\n");
  });

  it("sends a heartbeat every interval", async () => {
    const { read } = openStream(createEventBus<RealtimeEvent>(BUFFER), ANALYST);
    await skipPrelude(read);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);

    expect(await read()).toBe(": heartbeat\n\n");
  });

  it("stops the heartbeat and the subscription when the client cancels", async () => {
    const bus = createEventBus<RealtimeEvent>(BUFFER);
    const { reader } = openStream(bus, ANALYST);

    await reader.cancel();

    expect(vi.getTimerCount()).toBe(0);
    expect(() => bus.publish(eventOf("emp-ana"))).not.toThrow();
  });

  it("closes the stream when the request is aborted", async () => {
    const bus = createEventBus<RealtimeEvent>(BUFFER);
    const { controller, reader, read } = openStream(bus, ANALYST);
    await skipPrelude(read);

    controller.abort();

    expect((await reader.read()).done).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(() => bus.publish(eventOf("emp-ana"))).not.toThrow();
  });

  it("does not stay subscribed when the request is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const reader = createEventStream({
      bus: createEventBus<RealtimeEvent>(BUFFER),
      audience: ANALYST,
      lastEventId: null,
      signal: controller.signal,
    }).getReader();

    expect((await reader.read()).done).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("presence of the stream", () => {
  it("registers the connection while the stream is open and releases it on abort", async () => {
    const connect = vi.fn(() => vi.fn());
    const controller = new AbortController();
    const reader = createEventStream({
      bus: createEventBus<RealtimeEvent>(BUFFER),
      audience: ANA,
      lastEventId: null,
      signal: controller.signal,
      presence: { connect },
    }).getReader();
    const release = connect.mock.results[0]?.value;

    await reader.read();
    controller.abort();
    await reader.read();

    expect(connect).toHaveBeenCalledExactlyOnceWith("emp-ana");
    expect(release).toHaveBeenCalledOnce();
  });
});
