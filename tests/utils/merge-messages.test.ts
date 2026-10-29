import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { mergeExternalMessages } from "../../src/utils/merge-messages";

const message = (
  id: string,
  authorKind: string,
  role: UIMessage["role"] = "assistant",
): UIMessage => ({
  id,
  role,
  parts: [{ type: "text", text: id }],
  metadata: { authorKind },
});

const idsOf = (messages: readonly UIMessage[]): string[] => messages.map(({ id }) => id);

describe("mergeExternalMessages", () => {
  const local = [message("u-1", "employee", "user"), message("local-agent", "agent")];

  it.each([
    {
      name: "appends a new analyst message",
      server: [message("a-1", "analyst")],
      expected: ["u-1", "local-agent", "a-1"],
    },
    {
      name: "appends a new system message",
      server: [message("s-1", "system")],
      expected: ["u-1", "local-agent", "s-1"],
    },
    {
      name: "keeps the order the server gave to several new messages",
      server: [message("s-1", "system"), message("a-1", "analyst"), message("s-2", "system")],
      expected: ["u-1", "local-agent", "s-1", "a-1", "s-2"],
    },
    {
      name: "does not repeat a message it already has",
      server: [message("u-1", "employee", "user"), message("local-agent", "analyst")],
      expected: ["u-1", "local-agent"],
    },
    {
      name: "ignores the agent and employee messages it shows from the stream",
      server: [message("db-agent", "agent"), message("db-user", "employee", "user")],
      expected: ["u-1", "local-agent"],
    },
    { name: "does nothing without server messages", server: [], expected: ["u-1", "local-agent"] },
  ])("$name", ({ server, expected }) => {
    expect(idsOf(mergeExternalMessages(local, server))).toEqual(expected);
  });

  it("does not mutate the local list", () => {
    const before = idsOf(local);

    mergeExternalMessages(local, [message("a-1", "analyst")]);

    expect(idsOf(local)).toEqual(before);
  });

  it("falls back to the role when a message carries no author metadata", () => {
    const bare: UIMessage = { id: "b-1", role: "assistant", parts: [] };

    expect(idsOf(mergeExternalMessages(local, [bare]))).toEqual(["u-1", "local-agent"]);
  });
});
