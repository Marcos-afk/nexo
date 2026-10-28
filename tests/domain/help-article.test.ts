import { describe, expect, it } from "vitest";
import {
  type ArticleApplicability,
  type ArticleConditions,
  type HelpArticle,
  rankArticles,
  resolveApplicability,
  type SearchContext,
} from "../../src/domain/help-article";

interface ApplicabilityCase {
  readonly name: string;
  readonly conditions: ArticleConditions | undefined;
  readonly context: SearchContext;
  readonly expected: ArticleApplicability;
}

const windows10Only: ArticleConditions = { windowsVersions: ["10"] };

const applicabilityCases: readonly ApplicabilityCase[] = [
  { name: "no conditions", conditions: null, context: {}, expected: "applies" },
  { name: "undefined conditions", conditions: undefined, context: {}, expected: "applies" },
  {
    name: "matching version",
    conditions: windows10Only,
    context: { windowsVersion: "10" },
    expected: "applies",
  },
  {
    name: "other version",
    conditions: windows10Only,
    context: { windowsVersion: "11" },
    expected: "not_applicable",
  },
  {
    name: "unknown version",
    conditions: windows10Only,
    context: {},
    expected: "needs_windows_version",
  },
];

const articles: readonly HelpArticle[] = [
  {
    id: "vpn",
    title: "VPN com erro 809",
    body: "Reinstale o cliente.",
    tags: ["vpn", "erro 809"],
    conditions: windows10Only,
  },
  { id: "wifi", title: "Senha do Wi-Fi", body: "Enviada por e-mail.", tags: ["wifi", "senha"] },
];

describe("resolveApplicability", () => {
  it.each(applicabilityCases)("is $expected for $name", ({ conditions, context, expected }) => {
    expect(resolveApplicability(conditions, context)).toBe(expected);
  });
});

describe("rankArticles", () => {
  it("ignores accents and case", () => {
    const [match] = rankArticles(articles, "SENHA do WI-FI");

    expect(match?.article.id).toBe("wifi");
  });

  it("orders by the share of query terms found", () => {
    const matches = rankArticles(articles, "vpn erro 809 senha");

    expect(matches.map((match) => match.article.id)).toEqual(["vpn", "wifi"]);
  });

  it("returns nothing when no term matches", () => {
    expect(rankArticles(articles, "impressora")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(rankArticles(articles, "vpn senha", {}, 1)).toHaveLength(1);
  });

  it("flags the applicability of each match for the given Windows version", () => {
    const [match] = rankArticles(articles, "vpn 809", { windowsVersion: "11" });

    expect(match?.applicability).toBe("not_applicable");
  });
});
