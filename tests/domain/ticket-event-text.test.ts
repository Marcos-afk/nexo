import { describe, expect, it } from "vitest";
import { ticketEventKinds } from "../../src/domain/ticket";
import { ticketEventText } from "../../src/domain/ticket-event-text";

describe("ticketEventText", () => {
  it.each([
    ["created", null, null, "Chamado aberto"],
    ["updated", { note: "Já tentei reiniciar." }, null, "Chamado atualizado: Já tentei reiniciar."],
    ["updated", null, null, "Chamado atualizado"],
    ["reopened", null, null, "Chamado reaberto"],
    [
      "transferred",
      { reason: "Pedido do funcionário" },
      null,
      "Transferido ao suporte: Pedido do funcionário",
    ],
    ["transferred", { unexpected: true }, null, "Transferido ao suporte"],
    ["assumed", null, "Rafael Lima", "Assumido por Rafael Lima"],
    ["assumed", null, null, "Assumido por um analista"],
    [
      "resolved",
      { resolution: "Cliente VPN reinstalado." },
      null,
      "Chamado resolvido: Cliente VPN reinstalado.",
    ],
    ["resolved", null, null, "Chamado resolvido"],
  ] as const)("writes %s with payload %j", (kind, payload, actorName, expected) => {
    expect(ticketEventText(kind, { actorName, payload })).toBe(expected);
  });

  it("covers every event kind", () => {
    ticketEventKinds.forEach((kind) => {
      expect(ticketEventText(kind, { actorName: null, payload: null })).not.toBe("");
    });
  });
});
