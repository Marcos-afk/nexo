import { describe, expect, it } from "vitest";
import { shortcutLabelOf } from "../../src/utils/shortcut";

describe("shortcutLabelOf", () => {
  it.each([
    {
      name: "macOS",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      expected: "⌘↵",
    },
    {
      name: "iPad",
      userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      expected: "⌘↵",
    },
    {
      name: "Windows",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
      expected: "Ctrl+↵",
    },
    {
      name: "Linux",
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0",
      expected: "Ctrl+↵",
    },
  ])("$name", ({ userAgent, expected }) => {
    expect(shortcutLabelOf(userAgent)).toBe(expected);
  });
});
