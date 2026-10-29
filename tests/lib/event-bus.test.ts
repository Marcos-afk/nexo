import { describe, expect, it } from "vitest";
import { createEventBus } from "../../src/lib/event-bus";

const CAPACITY = 3;

const publishAll = (count: number) => {
  const bus = createEventBus<string>(CAPACITY);
  Array.from({ length: count }, (_, index) => bus.publish(`event-${index + 1}`));

  return bus;
};

describe("event bus", () => {
  it("returns incremental ids starting at 1", () => {
    const bus = createEventBus<string>(CAPACITY);

    expect([bus.publish("a"), bus.publish("b"), bus.publish("c")]).toEqual([1, 2, 3]);
  });

  it("delivers entries to subscribers in publication order", () => {
    const bus = createEventBus<string>(CAPACITY);
    const seen: string[] = [];

    bus.subscribe((entry) => seen.push(entry.event));
    bus.publish("a");
    bus.publish("b");

    expect(seen).toEqual(["a", "b"]);
  });

  it("stops delivering after the subscription is cancelled", () => {
    const bus = createEventBus<string>(CAPACITY);
    const seen: string[] = [];
    const cancel = bus.subscribe((entry) => seen.push(entry.event));

    bus.publish("a");
    cancel();
    bus.publish("b");

    expect(seen).toEqual(["a"]);
  });

  it("keeps only the last entries up to the capacity", () => {
    const bus = publishAll(5);

    expect(bus.replay(2)).toEqual({
      resync: false,
      entries: [
        { id: 3, event: "event-3" },
        { id: 4, event: "event-4" },
        { id: 5, event: "event-5" },
      ],
    });
  });

  it.each([
    { name: "equal to the last emitted", lastId: 5, resync: false, ids: [] },
    { name: "in the middle of the buffer", lastId: 3, resync: false, ids: [4, 5] },
    { name: "just before the oldest kept", lastId: 2, resync: false, ids: [3, 4, 5] },
    { name: "older than the buffer", lastId: 1, resync: true, ids: [] },
    { name: "newer than the last emitted", lastId: 9, resync: true, ids: [] },
  ])("replay with last id $name", ({ lastId, resync, ids }) => {
    const result = publishAll(5).replay(lastId);

    expect(result.resync).toBe(resync);
    expect(result.resync ? [] : result.entries.map((entry) => entry.id)).toEqual(ids);
  });

  it("replays nothing and does not resync on an empty bus with last id 0", () => {
    expect(createEventBus<string>(CAPACITY).replay(0)).toEqual({ resync: false, entries: [] });
  });
});
