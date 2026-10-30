import { RequestContext } from "@mastra/core/request-context";
import { describe, expect, it } from "vitest";
import { MissingEmployeeContextError } from "../../src/domain/errors";
import { CONVERSATION_ID_KEY, EMPLOYEE_ID_KEY } from "../../src/mastra/request-context";
import { createAgentTools } from "../../src/mastra/tools/agent";
import { matchesScope, ticketScopes } from "../../src/mastra/tools/agent/list-my-tickets-tool";
import { createDraftService } from "../../src/services/drafts/draft-service";
import { createHandoffService } from "../../src/services/handoff/handoff-service";
import { createHelpCenterService } from "../../src/services/help-center/help-center-service";
import { createTicketService } from "../../src/services/tickets/ticket-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T10:00:00-03:00";
const ANA = "emp-ana";
const ANA_CHAT = "c-ana-chat";
const LOCAL_DATE_TIME = /^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/;

const createTools = async () => {
  const database = await createSeededDatabase();
  const clock = createFixedClock(NOW);
  const ids = createSequentialIds("tool");
  const deps = { database, clock, ids };
  const tickets = createTicketService(deps);

  return {
    tickets,
    tools: createAgentTools({
      tickets,
      helpCenter: createHelpCenterService({ database }),
      drafts: createDraftService(deps),
      handoff: createHandoffService(deps),
      clock,
    }),
  };
};

const contextFor = (employeeId: string = ANA): RequestContext => {
  const context = new RequestContext();
  context.set(EMPLOYEE_ID_KEY, employeeId);
  context.set(CONVERSATION_ID_KEY, ANA_CHAT);

  return context;
};

const invoke = async (
  tool: { execute?: (input: never, context: never) => unknown },
  input: unknown,
  requestContext: RequestContext = contextFor(),
): Promise<Record<string, unknown>> => {
  if (!tool.execute) {
    throw new Error("tool without execute");
  }

  return (await tool.execute(input as never, { requestContext } as never)) as Record<
    string,
    unknown
  >;
};

const numbersOf = (result: Record<string, unknown>, key = "tickets"): string[] =>
  (result[key] as readonly { number: string }[]).map((ticket) => ticket.number);

describe("listMyTickets", () => {
  it.each([
    { number: "INC-20311", status: "Aguardando analista" },
    { number: "INC-20298", status: "Em andamento" },
    { number: "REQ-10442", status: "Aprovado" },
    { number: "INC-19877", status: "Resolvido" },
  ])("says $number is '$status' in Portuguese", async ({ number, status }) => {
    const { tools } = await createTools();
    const result = await invoke(tools.listMyTickets, { scope: "all" });
    const found = (result.tickets as readonly { number: string; status: string }[]).find(
      (ticket) => ticket.number === number,
    );

    expect(found?.status).toBe(status);
  });

  it("gives every date in Brasília time, never as ISO", async () => {
    const { tools } = await createTools();
    const result = await invoke(tools.listMyTickets, { scope: "all" });
    const [first] = result.tickets as readonly { dueAt: string; updatedAt: string }[];

    expect(first?.dueAt).toMatch(LOCAL_DATE_TIME);
    expect(first?.updatedAt).toMatch(LOCAL_DATE_TIME);
  });

  it.each([
    { scope: "unresolved", expected: ["INC-20311", "INC-20298", "REQ-10442"] },
    { scope: "resolved", expected: ["INC-19877", "INC-19410"] },
    { scope: "all", expected: 5 },
  ])("returns the $scope tickets of the session employee", async ({ scope, expected }) => {
    const { tools } = await createTools();
    const result = await invoke(tools.listMyTickets, { scope });

    if (typeof expected === "number") {
      expect(numbersOf(result)).toHaveLength(expected);
      return;
    }

    expect(numbersOf(result).toSorted()).toEqual(expected.toSorted());
  });

  it("never lists tickets from another employee", async () => {
    const { tools } = await createTools();
    const result = await invoke(tools.listMyTickets, { scope: "all" }, contextFor("emp-carla"));

    expect(numbersOf(result)).toEqual(["INC-20150"]);
  });

  it("flags the overdue ticket and never flags a resolved one", async () => {
    const { tools } = await createTools();
    const result = await invoke(tools.listMyTickets, { scope: "all" });
    const overdueByNumber = Object.fromEntries(
      (result.tickets as readonly { number: string; overdue: boolean }[]).map((ticket) => [
        ticket.number,
        ticket.overdue,
      ]),
    );

    expect(overdueByNumber["INC-20311"]).toBe(true);
    expect(overdueByNumber["INC-19877"]).toBe(false);
  });

  it("rejects a call without the employee in the session", async () => {
    const { tools } = await createTools();

    await expect(invoke(tools.listMyTickets, {}, new RequestContext())).rejects.toBeInstanceOf(
      MissingEmployeeContextError,
    );
  });
});

describe("matchesScope", () => {
  it.each([
    { scope: "unresolved", status: "open", expected: true },
    { scope: "unresolved", status: "resolved", expected: false },
    { scope: "resolved", status: "resolved", expected: true },
    { scope: "resolved", status: "in_progress", expected: false },
    { scope: "all", status: "approved", expected: true },
    { scope: "all", status: "resolved", expected: true },
  ] as const)("$scope with $status is $expected", ({ scope, status, expected }) => {
    expect(ticketScopes).toContain(scope);
    expect(matchesScope(status, scope)).toBe(expected);
  });
});

describe("getTicket", () => {
  it("returns an owned ticket with its details", async () => {
    const { tools } = await createTools();
    const result = await invoke(tools.getTicket, { number: "INC-20311" });

    expect(result.ticket).toMatchObject({ number: "INC-20311", overdue: true, reopenable: false });
  });

  it("answers the same way for another employee's ticket and a missing one", async () => {
    const { tools } = await createTools();
    const foreign = await invoke(tools.getTicket, { number: "INC-20150" });
    const missing = await invoke(tools.getTicket, { number: "INC-99999" });

    expect(foreign).toEqual(missing);
    expect(foreign).toHaveProperty("error");
  });
});

describe("searchHelpArticles", () => {
  it.each([
    { windowsVersion: undefined, expected: "needs_windows_version" },
    { windowsVersion: "11", expected: "not_applicable" },
    { windowsVersion: "10", expected: "applies" },
  ])("reports $expected for the VPN article with Windows $windowsVersion", async (testCase) => {
    const { tools } = await createTools();
    const input = { query: "vpn erro 809", windowsVersion: testCase.windowsVersion };
    const result = await invoke(tools.searchHelpArticles, input);
    const article = (result.articles as readonly { id: string; applicability: string }[]).find(
      (item) => item.id === "kb-vpn-809",
    );

    expect(article?.applicability).toBe(testCase.expected);
  });
});

describe("findSimilarTickets", () => {
  it("lists every valid category for the model and rejects any other", async () => {
    const { tools } = await createTools();
    const validate = tools.findSimilarTickets.inputSchema?.["~standard"].validate;
    const accepts = async (category: string) => !(await validate?.({ category }))?.issues;

    expect(tools.findSimilarTickets.description).toContain("Rede e VPN");
    expect(await accepts("SharePoint")).toBe(false);
    expect(await accepts("Acesso")).toBe(true);
  });

  it("separates open tickets from recently resolved ones", async () => {
    const { tools } = await createTools();
    const result = await invoke(tools.findSimilarTickets, { category: "Acesso" });

    expect(numbersOf(result, "open")).toEqual(["INC-20298"]);
    expect(numbersOf(result, "recentlyResolved")).toEqual([]);
  });
});

const validCreate = {
  mode: "create",
  ticket: {
    type: "incident",
    category: "Rede e VPN",
    subcategory: null,
    title: "VPN cai a cada 10 minutos",
    description: "A conexão da VPN cai e volta sozinha.",
    priority: "high",
    affected: "Ana Souza",
  },
};

describe("buildDraft", () => {
  it("proposes a pending draft with its due date and creates no ticket", async () => {
    const { tools, tickets } = await createTools();
    const before = await tickets.list(ANA);
    const result = await invoke(tools.buildDraft, validCreate);

    expect(result).toMatchObject({ mode: "create", status: "pending" });
    expect(result.dueAt).toMatch(LOCAL_DATE_TIME);
    expect(await tickets.list(ANA)).toHaveLength(before.length);
  });

  it("refuses a critical draft when only one person is affected, and explains why", async () => {
    const { tools, tickets } = await createTools();
    const before = await tickets.list(ANA);
    const result = await invoke(tools.buildDraft, {
      ...validCreate,
      ticket: { ...validCreate.ticket, priority: "critical", affected: "Somente eu" },
    });

    expect(result).toHaveProperty("error");
    expect(JSON.stringify(result)).toContain("prioridade crítica");
    expect(await tickets.list(ANA)).toHaveLength(before.length);
  });

  it.each([
    { name: "create without the ticket", input: { mode: "create" } },
    { name: "update without the note", input: { mode: "update", ticketNumber: "INC-20311" } },
    { name: "reopen without the number", input: { mode: "reopen" } },
  ])("returns a failure for $name", async ({ input }) => {
    const { tools } = await createTools();

    expect(await invoke(tools.buildDraft, input)).toHaveProperty("error");
  });

  it("returns a failure when the target ticket belongs to someone else", async () => {
    const { tools } = await createTools();
    const result = await invoke(tools.buildDraft, {
      mode: "update",
      ticketNumber: "INC-20150",
      note: "Ainda sem solução.",
    });

    expect(result).toHaveProperty("error");
  });
});

describe("requestHandoff", () => {
  it("moves the conversation to the analyst queue with a contact deadline", async () => {
    const { tools } = await createTools();
    const result = await invoke(tools.requestHandoff, {
      reason: "Pedido do funcionário",
      summary: "Ana pediu para falar com um analista sobre o notebook.",
      urgency: "normal",
    });

    expect(result.mode).toBe("awaiting_analyst");
    expect(result.contactDueAt).toMatch(LOCAL_DATE_TIME);
  });

  it("returns a failure when the conversation is no longer with the agent", async () => {
    const { tools } = await createTools();
    const input = { reason: "x", summary: "y", urgency: "normal" };

    await invoke(tools.requestHandoff, input);

    expect(await invoke(tools.requestHandoff, input)).toHaveProperty("error");
  });
});

describe("offerChoices", () => {
  it("echoes the options so the screen can show them as buttons", async () => {
    const { tools } = await createTools();
    const result = await invoke(tools.offerChoices, {
      options: ["Só eu", "Minha equipe", "Toda a empresa", "Não sei"],
    });

    expect(result).toEqual({ options: ["Só eu", "Minha equipe", "Toda a empresa", "Não sei"] });
  });

  it.each([
    { name: "a single option", options: ["Só eu"] },
    { name: "too many options", options: ["a", "b", "c", "d", "e", "f"] },
    { name: "an empty option", options: ["Sim", ""] },
    { name: "a very long option", options: ["Sim", "x".repeat(41)] },
  ])("rejects $name", async ({ options }) => {
    const { tools } = await createTools();
    const result = await tools.offerChoices.inputSchema?.["~standard"].validate({ options });

    expect(result?.issues).toBeDefined();
  });
});
