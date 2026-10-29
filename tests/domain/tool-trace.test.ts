import { describe, expect, it } from "vitest";
import { parseToolTrace, summarizeToolOutput } from "../../src/domain/tool-trace";

describe("summarizeToolOutput", () => {
  it.each([
    ["listMyTickets", { tickets: [{}, {}] }, "2 chamados"],
    ["listMyTickets", { tickets: [{}] }, "1 chamado"],
    ["getTicket", { ticket: { number: "INC-1", status: "open" } }, "INC-1 · open"],
    ["searchHelpArticles", { articles: [] }, "0 artigos"],
    [
      "findSimilarTickets",
      { open: [{}], recentlyResolved: [] },
      "1 em aberto, 0 resolvidos recentemente",
    ],
    ["buildDraft", { draftId: "d1", mode: "create" }, "Rascunho d1 (create)"],
    ["requestHandoff", { mode: "queue" }, "Conversa em queue"],
    ["offerChoices", { options: [{}, {}, {}] }, "3 opções"],
    ["unknownTool", { any: true }, null],
    ["listMyTickets", { unexpected: true }, null],
  ])("summarizes %s", (name, output, summary) => {
    expect(summarizeToolOutput(name, output)).toEqual({ summary, failed: false });
  });

  it("flags an error output as failed", () => {
    expect(summarizeToolOutput("getTicket", { error: "Chamado não encontrado" })).toEqual({
      summary: "Chamado não encontrado",
      failed: true,
    });
  });
});

describe("parseToolTrace", () => {
  it.each([
    [null, []],
    ["texto", []],
    [[{ nope: 1 }], []],
    [
      [{ name: "listMyTickets", args: { a: 1 } }],
      [
        {
          callId: "legacy-0",
          name: "listMyTickets",
          input: { a: 1 },
          summary: null,
          durationMs: null,
          failed: false,
        },
      ],
    ],
    [
      [
        {
          callId: "c1",
          name: "getTicket",
          input: { n: 1 },
          summary: "ok",
          durationMs: 12,
          failed: true,
        },
      ],
      [
        {
          callId: "c1",
          name: "getTicket",
          input: { n: 1 },
          summary: "ok",
          durationMs: 12,
          failed: true,
        },
      ],
    ],
  ])("reads %j", (raw, expected) => {
    expect(parseToolTrace(raw)).toEqual(expected);
  });
});
