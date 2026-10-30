import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTypingStore } from "../../src/lib/typing-store";

const EXPIRY_MS = 4000;

describe("typing store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks a conversation as typing and notifies once", () => {
    const store = createTypingStore(EXPIRY_MS);
    const listener = vi.fn();

    store.subscribe(listener);
    store.mark("c-1");
    store.mark("c-1");

    expect([...store.snapshot()]).toEqual(["c-1"]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it.each([
    { name: "before the expiry", elapsed: EXPIRY_MS - 1, typing: true },
    { name: "at the expiry", elapsed: EXPIRY_MS, typing: false },
  ])("stops typing $name", ({ elapsed, typing }) => {
    const store = createTypingStore(EXPIRY_MS);

    store.mark("c-1");
    vi.advanceTimersByTime(elapsed);

    expect(store.snapshot().has("c-1")).toBe(typing);
  });

  it("renews the expiry when typing continues", () => {
    const store = createTypingStore(EXPIRY_MS);

    store.mark("c-1");
    vi.advanceTimersByTime(EXPIRY_MS - 1);
    store.mark("c-1");
    vi.advanceTimersByTime(EXPIRY_MS - 1);

    expect(store.snapshot().has("c-1")).toBe(true);
  });

  it("clears right away and swaps the snapshot", () => {
    const store = createTypingStore(EXPIRY_MS);

    store.mark("c-1");
    store.mark("c-2");

    const before = store.snapshot();

    store.clear("c-1");

    expect([...store.snapshot()]).toEqual(["c-2"]);
    expect(store.snapshot()).not.toBe(before);
  });

  it("ignores a clear for a conversation that is not typing", () => {
    const store = createTypingStore(EXPIRY_MS);
    const listener = vi.fn();

    store.subscribe(listener);
    store.clear("c-1");

    expect(listener).not.toHaveBeenCalled();
  });

  it("drops pending timers on dispose", () => {
    const store = createTypingStore(EXPIRY_MS);
    const listener = vi.fn();

    store.mark("c-1");
    store.subscribe(listener);
    store.dispose();
    vi.advanceTimersByTime(EXPIRY_MS);

    expect(listener).not.toHaveBeenCalled();
  });
});
