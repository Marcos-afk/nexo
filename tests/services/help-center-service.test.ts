import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { helpArticles } from "../../src/db/schema";
import { ArticleConditionsInvalidError } from "../../src/domain/errors";
import type { ArticleApplicability, SearchContext } from "../../src/domain/help-article";
import { createHelpCenterService } from "../../src/services/help-center/help-center-service";
import { createSeededDatabase } from "../support/database";

const VPN_ARTICLE = "kb-vpn-809";
const VPN_QUERY = "VPN erro 809";

interface VpnCase {
  readonly name: string;
  readonly context: SearchContext;
  readonly applicability: ArticleApplicability;
}

const vpnCases: readonly VpnCase[] = [
  { name: "Windows 10", context: { windowsVersion: "10" }, applicability: "applies" },
  { name: "Windows 11", context: { windowsVersion: "11" }, applicability: "not_applicable" },
  { name: "unknown version", context: {}, applicability: "needs_windows_version" },
];

const createService = async () => {
  const database = await createSeededDatabase();

  return { database, service: createHelpCenterService({ database }) };
};

describe("help center search", () => {
  it("finds the VPN article first for its error code", async () => {
    const { service } = await createService();
    const [match] = await service.search(VPN_QUERY);

    expect(match?.article.id).toBe(VPN_ARTICLE);
  });

  it.each(vpnCases)("marks the VPN article for $name", async ({ context, applicability }) => {
    const { service } = await createService();
    const [match] = await service.search(VPN_QUERY, context);

    expect(match?.applicability).toBe(applicability);
  });

  it("does not restrict articles without conditions", async () => {
    const { service } = await createService();
    const matches = await service.search("horario atendimento", { windowsVersion: "11" });

    expect(matches[0]?.article.id).toBe("kb-service-desk-hours");
    expect(matches[0]?.applicability).toBe("applies");
  });

  it("fails with a typed error when stored conditions are invalid", async () => {
    const { database, service } = await createService();
    await database
      .update(helpArticles)
      .set({ conditions: { windowsVersions: ["95"] } })
      .where(eq(helpArticles.id, VPN_ARTICLE));

    await expect(service.search(VPN_QUERY)).rejects.toBeInstanceOf(ArticleConditionsInvalidError);
  });
});
