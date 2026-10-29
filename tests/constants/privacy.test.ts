import { describe, expect, it } from "vitest";
import { PRIVACY_SECTIONS } from "../../src/constants/privacy";
import { BROWSER_SESSION_MS, REMEMBER_SESSION_MS } from "../../src/services/auth/auth-service";

const MS_PER_HOUR = 3_600_000;
const HOURS_PER_DAY = 24;

const textOf = (id: string): string => {
  const section = PRIVACY_SECTIONS.find((candidate) => candidate.id === id);

  return [...(section?.paragraphs ?? []), ...(section?.items ?? [])].join(" ");
};

describe("PRIVACY_SECTIONS", () => {
  it("gives every section a unique id and a title", () => {
    const ids = PRIVACY_SECTIONS.map((section) => section.id);

    expect(new Set(ids).size).toBe(ids.length);
    PRIVACY_SECTIONS.forEach((section) => {
      expect(section.title.length).toBeGreaterThan(0);
    });
  });

  it("never leaves a section without content", () => {
    PRIVACY_SECTIONS.forEach((section) => {
      expect(section.paragraphs.length + section.items.length).toBeGreaterThan(0);
    });
  });

  it.each([
    { id: "stored", expected: ["mensagens", "chamados", "cookie"] },
    { id: "visibility", expected: ["apenas as próprias", "analistas"] },
    { id: "model", expected: ["Google Gemini"] },
    { id: "demo", expected: ["qualquer senha", "nenhum e-mail é enviado"] },
  ])("covers $expected in the $id section", ({ id, expected }) => {
    expected.forEach((fragment) => {
      expect(textOf(id)).toContain(fragment);
    });
  });

  it("states the same session lengths the app really uses", () => {
    const session = textOf("session");

    expect(session).toContain(`${REMEMBER_SESSION_MS / (HOURS_PER_DAY * MS_PER_HOUR)} dias`);
    expect(session).toContain(`${BROWSER_SESSION_MS / MS_PER_HOUR} horas`);
  });
});
