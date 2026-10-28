import { describe, expect, it } from "vitest";
import { planTurn, type TurnInput } from "../../src/conversation/turn-planner";
import { handoffDoneReply, outOfScopeReply } from "../../src/conversation/turn-replies";
import type { Triage } from "../../src/domain/triage";
import { createConversationService } from "../../src/services/conversations/conversation-service";
import { createHandoffService } from "../../src/services/handoff/handoff-service";
import { createTicketService } from "../../src/services/tickets/ticket-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T10:00:00-03:00";
const ANA = "emp-ana";
const REF = { ownerId: ANA, conversationId: "c-ana-chat" };
const MS_PER_MINUTE = 60_000;
const URGENT_CONTACT_MINUTES = 30;

const buildTriage = (patch: Partial<Triage> = {}): Triage => ({
  intent: "how_to",
  understood: "Quer ajuda com o Outlook.",
  confidence: 90,
  rationale: "Mensagem clara.",
  signals: [],
  ...patch,
});

const buildInput = (patch: Partial<TurnInput> = {}): TurnInput => ({
  ref: REF,
  mode: "agent",
  text: "Meu Outlook não abre",
  triage: buildTriage(),
  ...patch,
});

const setup = async () => {
  const database = await createSeededDatabase();
  const clock = createFixedClock(NOW);
  const deps = { database, clock, ids: createSequentialIds("plan") };

  return {
    deps: { tickets: createTicketService(deps), handoff: createHandoffService(deps), clock },
    conversations: createConversationService(deps),
  };
};

describe("planTurn: replies without the model", () => {
  it("redirects an out-of-scope subject and leaves the conversation with the agent", async () => {
    const { deps, conversations } = await setup();
    const plan = await planTurn(
      deps,
      buildInput({ triage: buildTriage({ intent: "out_of_scope" }) }),
    );

    expect(plan).toEqual({
      kind: "fixed_reply",
      action: "redirect_out_of_scope",
      text: outOfScopeReply,
    });
    expect((await conversations.getActive(ANA))?.mode).toBe("agent");
  });

  it.each([
    {
      name: "asks for an analyst",
      patch: { intent: "human_request" as const },
      action: "handoff:employee_request",
    },
    {
      name: "reports a critical impact",
      patch: { signals: ["critical_impact" as const] },
      action: "handoff:critical_incident",
    },
    { name: "is not understood", patch: { confidence: 40 }, action: "handoff:low_confidence" },
  ])("transfers the conversation when the employee $name", async ({ patch, action }) => {
    const { deps, conversations } = await setup();
    const plan = await planTurn(deps, buildInput({ triage: buildTriage(patch) }));

    expect(plan).toEqual({ kind: "fixed_reply", action, text: handoffDoneReply });
    expect((await conversations.getActive(ANA))?.mode).toBe("awaiting_analyst");
  });

  it("gives a critical incident the urgent contact deadline", async () => {
    const { deps, conversations } = await setup();

    await planTurn(deps, buildInput({ triage: buildTriage({ signals: ["critical_impact"] }) }));
    const conversation = await conversations.getActive(ANA);
    const dueAt = conversation?.contactDueAt?.getTime() ?? 0;

    expect((dueAt - new Date(NOW).getTime()) / MS_PER_MINUTE).toBe(URGENT_CONTACT_MINUTES);
    expect(conversation?.handoffReason).toBe("Incidente crítico");
  });

  it("skips the model when the conversation is not with the agent", async () => {
    const { deps } = await setup();

    expect(await planTurn(deps, buildInput({ mode: "with_analyst" }))).toEqual({ kind: "skip" });
  });
});

describe("planTurn: answers with the model", () => {
  it("allows the tools of the intent", async () => {
    const { deps } = await setup();

    expect(await planTurn(deps, buildInput())).toEqual({
      kind: "answer",
      action: "answer",
      toolNames: ["searchHelpArticles"],
      offerAnalyst: false,
    });
  });

  it.each([
    {
      name: "offers an analyst when a ticket lookup finds an overdue ticket",
      input: buildInput({ triage: buildTriage({ intent: "ticket_lookup" }) }),
      offerAnalyst: true,
    },
    {
      name: "does not look for overdue tickets on other intents",
      input: buildInput({ triage: buildTriage({ intent: "ticket_create" }) }),
      offerAnalyst: false,
    },
    {
      name: "does not offer an analyst when nothing is overdue",
      input: buildInput({
        ref: { ownerId: "emp-carla", conversationId: "c-carla" },
        triage: buildTriage({ intent: "ticket_lookup" }),
      }),
      offerAnalyst: false,
    },
  ])("$name", async ({ input, offerAnalyst }) => {
    const { deps } = await setup();

    expect(await planTurn(deps, input)).toMatchObject({ kind: "answer", offerAnalyst });
  });
});
