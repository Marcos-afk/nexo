import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import type { MessageAuthorKind } from "../../src/domain/conversation";
import { StoredConversationInvalidError } from "../../src/domain/errors";
import type { Message } from "../../src/services/conversations/conversation-service";
import {
  AGENT_HISTORY_WINDOW,
  extractText,
  hasReplyContent,
  selectAgentHistory,
  toUiMessages,
} from "../../src/services/conversations/history";

const OWNER = "emp-ana";
const CREATED_AT = new Date("2026-10-28T10:00:00-03:00");

const buildMessage = (
  id: string,
  authorKind: MessageAuthorKind,
  content = id,
  parts: unknown = null,
): Message => ({
  id,
  conversationId: "c-1",
  authorKind,
  authorId: null,
  content,
  parts,
  createdAt: CREATED_AT,
  deliveredAt: null,
  readAt: null,
});

interface RoleCase {
  readonly authorKind: MessageAuthorKind;
  readonly role: UIMessage["role"];
}

const roleCases: readonly RoleCase[] = [
  { authorKind: "employee", role: "user" },
  { authorKind: "agent", role: "assistant" },
  { authorKind: "analyst", role: "assistant" },
  { authorKind: "system", role: "assistant" },
];

describe("toUiMessages", () => {
  it.each(roleCases)("maps $authorKind to $role", async ({ authorKind, role }) => {
    const [message] = await toUiMessages(OWNER, [buildMessage("m-1", authorKind, "oi")]);

    expect(message?.role).toBe(role);
    expect(message?.parts).toEqual([{ type: "text", text: "oi" }]);
  });

  it("prefers the stored parts over the plain content", async () => {
    const parts = [{ type: "text", text: "do parts" }];
    const [message] = await toUiMessages(OWNER, [buildMessage("m-1", "agent", "ignorado", parts)]);

    expect(message?.parts).toEqual(parts);
  });

  it("rejects stored parts with an invalid shape", async () => {
    const invalid = buildMessage("m-1", "agent", "x", [{ type: "unknown-part" }]);

    await expect(toUiMessages(OWNER, [invalid])).rejects.toBeInstanceOf(
      StoredConversationInvalidError,
    );
  });
});

describe("selectAgentHistory", () => {
  it("keeps only employee and agent messages", () => {
    const history = selectAgentHistory([
      buildMessage("m-1", "employee"),
      buildMessage("m-2", "analyst"),
      buildMessage("m-3", "system"),
      buildMessage("m-4", "agent"),
    ]);

    expect(history.map((message) => message.id)).toEqual(["m-1", "m-4"]);
  });

  it("keeps only the most recent window and starts at an employee message", () => {
    const messages = Array.from({ length: AGENT_HISTORY_WINDOW + 5 }, (_, index) =>
      buildMessage(`m-${index}`, index % 2 === 0 ? "employee" : "agent"),
    );
    const history = selectAgentHistory(messages);

    expect(history.length).toBeLessThanOrEqual(AGENT_HISTORY_WINDOW);
    expect(history[0]?.authorKind).toBe("employee");
    expect(history.at(-1)?.id).toBe(messages.at(-1)?.id);
  });

  it("is empty when the employee has not written yet", () => {
    expect(selectAgentHistory([buildMessage("m-1", "agent")])).toEqual([]);
  });
});

describe("reply helpers", () => {
  const reply = (parts: UIMessage["parts"]): UIMessage => ({ id: "r-1", role: "assistant", parts });

  it("joins only the text parts", () => {
    const message = reply([
      { type: "text", text: "Olá, " },
      { type: "step-start" },
      { type: "text", text: "Ana." },
    ]);

    expect(extractText(message)).toBe("Olá, Ana.");
  });

  it.each([
    { name: "only a step-start part", parts: [{ type: "step-start" }], expected: false },
    { name: "no parts", parts: [], expected: false },
    { name: "a text part", parts: [{ type: "text", text: "oi" }], expected: true },
  ] as const)("reports reply content for $name", ({ parts, expected }) => {
    expect(hasReplyContent(reply([...parts]))).toBe(expected);
  });
});
