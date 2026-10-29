import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import {
  actionsOf,
  attachmentsOf,
  countEmployeeMessages,
  toChatLine,
} from "../../src/utils/chat-lines";

const message = (overrides: Partial<UIMessage> & Pick<UIMessage, "role">): UIMessage => ({
  id: "m-1",
  parts: [{ type: "text", text: "olá" }],
  ...overrides,
});

const toolPart = (name: string, state: string, output?: unknown) =>
  ({
    type: `tool-${name}`,
    toolCallId: `call-${name}`,
    state,
    input: {},
    output,
  }) as UIMessage["parts"][number];

describe("toChatLine author kind", () => {
  it.each([
    { name: "user role", input: message({ role: "user" }), expected: "employee" },
    { name: "assistant role", input: message({ role: "assistant" }), expected: "agent" },
    { name: "system role", input: message({ role: "system" }), expected: "system" },
    {
      name: "stored analyst metadata wins over the role",
      input: message({ role: "assistant", metadata: { authorKind: "analyst" } }),
      expected: "analyst",
    },
    {
      name: "stored system metadata wins over the role",
      input: message({ role: "assistant", metadata: { authorKind: "system" } }),
      expected: "system",
    },
    {
      name: "unknown metadata falls back to the role",
      input: message({ role: "assistant", metadata: { authorKind: "robot" } }),
      expected: "agent",
    },
  ])("$name", ({ input, expected }) => {
    expect(toChatLine(input).authorKind).toBe(expected);
  });

  it("keeps the id and joins the text parts", () => {
    const line = toChatLine(
      message({
        id: "m-9",
        role: "assistant",
        parts: [
          { type: "text", text: "um " },
          { type: "text", text: "dois" },
        ],
      }),
    );

    expect(line).toMatchObject({ id: "m-9", text: "um dois" });
  });
});

describe("actionsOf", () => {
  it.each([
    {
      name: "finished tool",
      part: toolPart("listMyTickets", "output-available", { tickets: [] }),
      status: "done",
    },
    {
      name: "tool still running",
      part: toolPart("listMyTickets", "input-available"),
      status: "running",
    },
    {
      name: "tool that errored",
      part: toolPart("listMyTickets", "output-error"),
      status: "failed",
    },
    {
      name: "tool that returned a failure payload",
      part: toolPart("listMyTickets", "output-available", { error: "Sistema fora do ar" }),
      status: "failed",
    },
  ])("$name", ({ part, status }) => {
    expect(actionsOf(message({ role: "assistant", parts: [part] }))).toEqual([
      { key: "call-listMyTickets", label: "consultou seus chamados", status },
    ]);
  });

  it.each([
    { tool: "searchHelpArticles", label: "buscou na central de ajuda" },
    { tool: "findSimilarTickets", label: "buscou chamados parecidos" },
    { tool: "getTicket", label: "consultou o chamado" },
    { tool: "buildDraft", label: "montou o rascunho" },
    { tool: "requestHandoff", label: "pediu um analista" },
  ])("labels $tool", ({ tool, label }) => {
    const [action] = actionsOf(
      message({ role: "assistant", parts: [toolPart(tool, "output-available", {})] }),
    );

    expect(action?.label).toBe(label);
  });

  it("ignores unknown tools and non-tool parts, keeping the execution order", () => {
    const actions = actionsOf(
      message({
        role: "assistant",
        parts: [
          { type: "step-start" },
          toolPart("searchHelpArticles", "output-available", {}),
          toolPart("somethingElse", "output-available", {}),
          toolPart("buildDraft", "input-available"),
          { type: "text", text: "pronto" },
        ],
      }),
    );

    expect(actions.map((action) => action.label)).toEqual([
      "buscou na central de ajuda",
      "montou o rascunho",
    ]);
  });
});

describe("countEmployeeMessages", () => {
  it("counts only the user messages", () => {
    expect(
      countEmployeeMessages([
        message({ id: "1", role: "user" }),
        message({ id: "2", role: "assistant" }),
        message({ id: "3", role: "user" }),
      ]),
    ).toBe(2);
  });
});

const summary = (overrides: Record<string, unknown> = {}) => ({
  number: "INC-20311",
  title: "Notebook lento após atualização",
  category: "Hardware",
  status: "Em andamento",
  priority: "medium",
  dueAt: "30/10/2026 às 10:00",
  overdue: false,
  updatedAt: "24/10/2026 às 09:30",
  ...overrides,
});

const detail = (overrides: Record<string, unknown> = {}) => ({
  ...summary(),
  type: "incident",
  subcategory: "Notebook",
  description: "Lento desde a atualização.",
  affected: "Só eu",
  createdAt: "16/10/2026 às 14:20",
  resolvedAt: null,
  reopenable: false,
  ...overrides,
});

describe("attachmentsOf", () => {
  it("turns buildDraft into a draft card keyed by the call", () => {
    const attachments = attachmentsOf(
      message({
        role: "assistant",
        parts: [toolPart("buildDraft", "output-available", { draftId: "D-381", mode: "create" })],
      }),
    );

    expect(attachments).toEqual([{ kind: "draft", key: "call-buildDraft", draftId: "D-381" }]);
  });

  it("turns listMyTickets into a selectable list", () => {
    const attachments = attachmentsOf(
      message({
        role: "assistant",
        parts: [toolPart("listMyTickets", "output-available", { tickets: [summary()] })],
      }),
    );

    expect(attachments).toMatchObject([
      { kind: "ticket-list", tickets: [{ number: "INC-20311" }] },
    ]);
  });

  it("turns getTicket into a ticket card", () => {
    const attachments = attachmentsOf(
      message({
        role: "assistant",
        parts: [toolPart("getTicket", "output-available", { ticket: detail() })],
      }),
    );

    expect(attachments).toMatchObject([{ kind: "ticket", ticket: { subcategory: "Notebook" } }]);
  });

  it.each([
    {
      name: "an empty ticket list",
      part: toolPart("listMyTickets", "output-available", { tickets: [] }),
    },
    { name: "a tool still running", part: toolPart("buildDraft", "input-available") },
    {
      name: "a tool failure payload",
      part: toolPart("buildDraft", "output-available", { error: "Incompleto" }),
    },
    {
      name: "a malformed ticket",
      part: toolPart("getTicket", "output-available", { ticket: { number: 1 } }),
    },
    { name: "a tool without a card", part: toolPart("searchHelpArticles", "output-available", {}) },
  ])("shows nothing for $name", ({ part }) => {
    expect(attachmentsOf(message({ role: "assistant", parts: [part] }))).toEqual([]);
  });

  it("keeps the order of the tool calls", () => {
    const attachments = attachmentsOf(
      message({
        role: "assistant",
        parts: [
          toolPart("getTicket", "output-available", { ticket: detail() }),
          toolPart("buildDraft", "output-available", { draftId: "D-1" }),
        ],
      }),
    );

    expect(attachments.map((attachment) => attachment.kind)).toEqual(["ticket", "draft"]);
  });

  it("is exposed on the chat line", () => {
    const line = toChatLine(
      message({
        role: "assistant",
        parts: [toolPart("buildDraft", "output-available", { draftId: "D-9" })],
      }),
    );

    expect(line.attachments).toHaveLength(1);
  });
});
