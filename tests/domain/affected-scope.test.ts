import { describe, expect, it } from "vitest";
import {
  affectsTeamOrCompany,
  CRITICAL_NEEDS_WIDE_IMPACT_MESSAGE,
  isPriorityConsistent,
} from "../../src/domain/affected-scope";
import { draftInputSchema } from "../../src/domain/draft";
import { ticketPriorities } from "../../src/domain/sla";

const baseTicket = {
  type: "incident",
  category: "Rede e VPN",
  subcategory: null,
  title: "VPN fora do ar",
  description: "Ninguém conecta na VPN.",
};

describe("affectsTeamOrCompany", () => {
  it.each([
    { affected: "Toda a empresa", expected: true },
    { affected: "Minha equipe", expected: true },
    { affected: "Equipe Financeiro", expected: true },
    { affected: "O DEPARTAMENTO inteiro", expected: true },
    { affected: "Toda a área comercial", expected: true },
    { affected: "umas 5 pessoas", expected: true },
    { affected: "Somente eu", expected: false },
    { affected: "Só eu", expected: false },
    { affected: "Não sei", expected: false },
    { affected: "Ana Souza", expected: false },
    { affected: "", expected: false },
    { affected: null, expected: false },
  ])("$affected -> $expected", ({ affected, expected }) => {
    expect(affectsTeamOrCompany(affected)).toBe(expected);
  });
});

describe("isPriorityConsistent", () => {
  it.each(ticketPriorities.filter((priority) => priority !== "critical"))(
    "accepts %s for a single person",
    (priority) => {
      expect(isPriorityConsistent(priority, "Somente eu")).toBe(true);
    },
  );

  it.each([
    { affected: "Somente eu", expected: false },
    { affected: null, expected: false },
    { affected: "Minha equipe", expected: true },
    { affected: "Toda a empresa", expected: true },
  ])("critical with $affected -> $expected", ({ affected, expected }) => {
    expect(isPriorityConsistent("critical", affected)).toBe(expected);
  });
});

describe("draftInputSchema: critical priority", () => {
  it.each([
    { name: "one person", affected: "Somente eu", valid: false },
    { name: "nobody informed", affected: null, valid: false },
    { name: "a team", affected: "Minha equipe", valid: true },
    { name: "the whole company", affected: "Toda a empresa", valid: true },
  ])("create with critical and $name is valid: $valid", ({ affected, valid }) => {
    const result = draftInputSchema.safeParse({
      mode: "create",
      ticket: { ...baseTicket, priority: "critical", affected },
    });

    expect(result.success).toBe(valid);
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      valid ? undefined : CRITICAL_NEEDS_WIDE_IMPACT_MESSAGE,
    );
  });

  it("never blocks a high priority for one person", () => {
    expect(
      draftInputSchema.safeParse({
        mode: "create",
        ticket: { ...baseTicket, priority: "high", affected: "Somente eu" },
      }).success,
    ).toBe(true);
  });
});
