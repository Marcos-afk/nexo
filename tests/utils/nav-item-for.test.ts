import { describe, expect, it } from "vitest";
import { PROFILE_NAV_ITEM, SUPPORT_NAV_ITEM } from "../../src/constants/navigation";
import { navItemFor } from "../../src/utils/nav-item-for";

describe("navItemFor", () => {
  it.each([
    { path: "/", expected: SUPPORT_NAV_ITEM },
    { path: "/perfil", expected: PROFILE_NAV_ITEM },
    { path: "/perfil/senha", expected: PROFILE_NAV_ITEM },
    { path: "/perfilx", expected: SUPPORT_NAV_ITEM },
    { path: "/nao-existe", expected: SUPPORT_NAV_ITEM },
  ])("$path", ({ path, expected }) => {
    expect(navItemFor(path)).toBe(expected);
  });
});
