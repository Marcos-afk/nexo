import { describe, expect, it } from "vitest";
import type { ChatLineProps } from "../../src/models/chat";
import { chatViewOf } from "../../src/utils/chat-view";

const line = (overrides: Partial<ChatLineProps>): ChatLineProps => ({
  id: "m-1",
  authorKind: "agent",
  text: "",
  actions: [],
  attachments: [],
  ...overrides,
});

const base = {
  lines: [] as ChatLineProps[],
  sentCount: 0,
  employeeMessageCount: 0,
  messageLimit: 30,
  status: "ready",
  assistantStatus: "online",
  mode: "agent",
} as const;

describe("chatViewOf typing indicator", () => {
  it.each([
    { name: "a request just sent", status: "submitted", lines: [], typing: true },
    {
      name: "streaming an empty agent reply",
      status: "streaming",
      lines: [line({ text: "" })],
      typing: true,
    },
    {
      name: "streaming a reply that already has text",
      status: "streaming",
      lines: [line({ text: "Olá" })],
      typing: false,
    },
    {
      name: "streaming right after an employee message",
      status: "streaming",
      lines: [line({ authorKind: "employee", text: "oi" })],
      typing: false,
    },
    { name: "idle", status: "ready", lines: [line({ text: "" })], typing: false },
    { name: "failed", status: "error", lines: [], typing: false },
  ] as const)("$name", ({ status, lines, typing }) => {
    expect(chatViewOf({ ...base, status, lines }).isTyping).toBe(typing);
  });
});

describe("chatViewOf message counter", () => {
  it.each([
    {
      name: "starts from the server value",
      sent: 0,
      stored: 4,
      text: "4/30 mensagens nesta sessão",
    },
    { name: "adds the messages sent now", sent: 3, stored: 4, text: "7/30 mensagens nesta sessão" },
    {
      name: "never goes below the server value",
      sent: -2,
      stored: 4,
      text: "4/30 mensagens nesta sessão",
    },
  ])("$name", ({ sent, stored, text }) => {
    expect(
      chatViewOf({ ...base, sentCount: sent, employeeMessageCount: stored }).counter.text,
    ).toBe(text);
  });

  it("blocks the composer and offers the analyst when the limit is reached", () => {
    const view = chatViewOf({ ...base, employeeMessageCount: 29, sentCount: 1 });

    expect(view.isComposerDisabled).toBe(true);
    expect(view.notice?.action).toBe("request-analyst");
  });
});

describe("chatViewOf layout flags", () => {
  it.each([
    { name: "empty conversation", lines: [], empty: true },
    { name: "conversation with messages", lines: [line({ text: "oi" })], empty: false },
  ])("$name", ({ lines, empty }) => {
    expect(chatViewOf({ ...base, lines }).isEmpty).toBe(empty);
  });

  it.each([
    { status: "submitted", busy: true },
    { status: "streaming", busy: true },
    { status: "ready", busy: false },
    { status: "error", busy: false },
  ] as const)("is busy while $status: $busy", ({ status, busy }) => {
    expect(chatViewOf({ ...base, status }).isBusy).toBe(busy);
  });

  it("changes the scroll key when the last reply grows", () => {
    const short = chatViewOf({ ...base, lines: [line({ text: "Olá" })] }).scrollKey;
    const long = chatViewOf({ ...base, lines: [line({ text: "Olá, tudo bem?" })] }).scrollKey;

    expect(short).not.toBe(long);
  });
});
