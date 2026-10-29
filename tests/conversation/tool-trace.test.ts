import type { UIMessage, UIMessageChunk } from "ai";
import { describe, expect, it } from "vitest";
import { buildToolTrace, createToolTimer } from "../../src/conversation/tool-trace";

const clockOf = (ticks: readonly number[]) => {
  const queue = [...ticks];

  return () => queue.shift() ?? 0;
};

const chunk = (value: Record<string, unknown>) => value as unknown as UIMessageChunk;

describe("createToolTimer", () => {
  it("measures the time between the tool input and its output", () => {
    const timer = createToolTimer(clockOf([100, 175]));

    timer.observe(chunk({ type: "tool-input-available", toolCallId: "c1" }));
    timer.observe(chunk({ type: "tool-output-available", toolCallId: "c1" }));

    expect(timer.durations.get("c1")).toBe(75);
  });

  it("ignores an output that never had an input", () => {
    const timer = createToolTimer(clockOf([100]));

    timer.observe(chunk({ type: "tool-output-error", toolCallId: "c9" }));

    expect(timer.durations.size).toBe(0);
  });
});

describe("buildToolTrace", () => {
  const reply = {
    id: "r1",
    role: "assistant",
    parts: [
      { type: "text", text: "Oi" },
      {
        type: "tool-listMyTickets",
        toolCallId: "c1",
        state: "output-available",
        input: { status: "open" },
        output: { tickets: [{}, {}] },
      },
      {
        type: "tool-getTicket",
        toolCallId: "c2",
        state: "output-error",
        input: { number: "X" },
        errorText: "falhou",
      },
    ],
  } as unknown as UIMessage;

  it("lists the tools of the reply with summary, input and duration", () => {
    expect(buildToolTrace(reply, new Map([["c1", 40]]))).toEqual([
      {
        callId: "c1",
        name: "listMyTickets",
        input: { status: "open" },
        summary: "2 chamados",
        failed: false,
        durationMs: 40,
      },
      {
        callId: "c2",
        name: "getTicket",
        input: { number: "X" },
        summary: "falhou",
        failed: true,
        durationMs: null,
      },
    ]);
  });
});
