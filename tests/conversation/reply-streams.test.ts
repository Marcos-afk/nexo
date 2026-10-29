import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { STREAM_FAILURE_MESSAGE, withFallbackText } from "../../src/conversation/reply-streams";
import { extractText } from "../../src/services/conversations/history";

const reply = (parts: UIMessage["parts"]): UIMessage => ({ id: "r-1", role: "assistant", parts });

const toolOnly = reply([
  { type: "step-start" },
  {
    type: "tool-listMyTickets",
    toolCallId: "call-1",
    state: "output-available",
    input: {},
    output: { tickets: [] },
  },
]);

describe("withFallbackText", () => {
  it("adds the failure notice when only a tool ran and no text came back", () => {
    expect(extractText(withFallbackText(toolOnly))).toBe(STREAM_FAILURE_MESSAGE);
  });

  it.each([
    { name: "a reply with text", message: reply([{ type: "text", text: "Olá" }]) },
    { name: "an empty reply", message: reply([{ type: "step-start" }]) },
  ])("leaves $name untouched", ({ message }) => {
    expect(withFallbackText(message)).toBe(message);
  });
});
