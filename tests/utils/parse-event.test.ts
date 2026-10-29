import { describe, expect, it } from "vitest";
import {
  conversationUpdatedEventSchema,
  messageCreatedEventSchema,
} from "../../src/schemas/events";
import { parseEventData } from "../../src/utils/parse-event";

describe("parseEventData with the message event", () => {
  it.each([
    {
      name: "a message from an analyst",
      raw: JSON.stringify({
        type: "message.created",
        conversationId: "c-1",
        ownerId: "emp-1",
        at: "2026-10-29T10:00:00.000Z",
        messageId: "m-1",
        authorKind: "analyst",
      }),
      expected: { authorKind: "analyst" },
    },
    { name: "an unknown author", raw: JSON.stringify({ authorKind: "robot" }), expected: null },
    { name: "a payload without the author", raw: JSON.stringify({}), expected: null },
    { name: "text that is not JSON", raw: "oops", expected: null },
    { name: "a data value that is not text", raw: 42, expected: null },
    { name: "nothing at all", raw: undefined, expected: null },
  ])("$name", ({ raw, expected }) => {
    expect(parseEventData(raw, messageCreatedEventSchema)).toEqual(expected);
  });
});

describe("parseEventData with the conversation event", () => {
  it.each([
    {
      raw: JSON.stringify({ mode: "awaiting_analyst", assignedAnalystId: null }),
      mode: "awaiting_analyst",
    },
    {
      raw: JSON.stringify({ mode: "with_analyst", assignedAnalystId: "analyst-rafael" }),
      mode: "with_analyst",
    },
    { raw: JSON.stringify({ mode: "agent", assignedAnalystId: null }), mode: "agent" },
  ])("reads the $mode mode", ({ raw, mode }) => {
    expect(parseEventData(raw, conversationUpdatedEventSchema)).toEqual({ mode });
  });

  it("rejects an unknown mode", () => {
    expect(
      parseEventData(JSON.stringify({ mode: "paused" }), conversationUpdatedEventSchema),
    ).toBeNull();
  });
});
