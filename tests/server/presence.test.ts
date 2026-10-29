import { describe, expect, it } from "vitest";
import type { RealtimeEvent } from "../../src/domain/realtime";
import { createPresenceTracker } from "../../src/server/presence";
import { createFixedClock } from "../support/clock";

const NOW = "2026-10-29T10:00:00-03:00";

const setup = () => {
  const published: RealtimeEvent[] = [];
  const tracker = createPresenceTracker({
    events: { publish: (event) => void published.push(event) },
    clock: createFixedClock(NOW),
  });

  return { published, tracker };
};

describe("presence tracker", () => {
  it("puts a person online when the first connection opens", () => {
    const { published, tracker } = setup();

    tracker.connect("emp-ana");

    expect(tracker.isOnline("emp-ana")).toBe(true);
    expect(tracker.isOnline("emp-bruno")).toBe(false);
    expect(published).toEqual([
      expect.objectContaining({ type: "presence.changed", ownerId: "emp-ana", online: true }),
    ]);
  });

  it("keeps the person online until the last connection closes", () => {
    const { published, tracker } = setup();
    const first = tracker.connect("emp-ana");
    const second = tracker.connect("emp-ana");

    first();

    expect(tracker.isOnline("emp-ana")).toBe(true);

    second();

    expect(tracker.isOnline("emp-ana")).toBe(false);
    expect(published.map((event) => event.type === "presence.changed" && event.online)).toEqual([
      true,
      false,
    ]);
  });

  it("ignores a connection that is released twice", () => {
    const { published, tracker } = setup();
    const first = tracker.connect("emp-ana");

    tracker.connect("emp-ana");
    first();
    first();

    expect(tracker.isOnline("emp-ana")).toBe(true);
    expect(published).toHaveLength(1);
  });
});
