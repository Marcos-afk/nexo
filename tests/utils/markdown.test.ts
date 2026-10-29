import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown } from "../../src/utils/markdown";

const spans = (text: string) => parseInline(text).map(({ kind, text: value }) => [kind, value]);

const simplify = (source: string) =>
  parseMarkdown(source).map((block) =>
    block.kind === "paragraph"
      ? { kind: block.kind, text: block.inlines.map((inline) => inline.text).join("") }
      : {
          kind: block.kind,
          ordered: block.ordered,
          start: block.start,
          items: block.items.map((item) => item.inlines.map((inline) => inline.text).join("")),
        },
  );

describe("parseInline", () => {
  it.each([
    { name: "plain text", input: "olá", expected: [["text", "olá"]] },
    {
      name: "bold",
      input: "um **dois** três",
      expected: [
        ["text", "um "],
        ["bold", "dois"],
        ["text", " três"],
      ],
    },
    {
      name: "italic",
      input: "um *dois* três",
      expected: [
        ["text", "um "],
        ["italic", "dois"],
        ["text", " três"],
      ],
    },
    {
      name: "inline code",
      input: "rode `pnpm dev` agora",
      expected: [
        ["text", "rode "],
        ["code", "pnpm dev"],
        ["text", " agora"],
      ],
    },
    {
      name: "bold and italic together",
      input: "**a** e *b*",
      expected: [
        ["bold", "a"],
        ["text", " e "],
        ["italic", "b"],
      ],
    },
    {
      name: "an unclosed bold marker stays literal",
      input: "**aberto",
      expected: [["text", "**aberto"]],
    },
    {
      name: "asterisks around spaces stay literal",
      input: "2 * 3 * 4",
      expected: [["text", "2 * 3 * 4"]],
    },
    { name: "html is kept as text", input: "<b>x</b>", expected: [["text", "<b>x</b>"]] },
    { name: "empty", input: "", expected: [] },
  ])("$name", ({ input, expected }) => {
    expect(spans(input)).toEqual(expected);
  });
});

describe("parseMarkdown", () => {
  it.each([
    {
      name: "paragraphs split by a blank line",
      source: "primeiro\n\nsegundo",
      expected: [
        { kind: "paragraph", text: "primeiro" },
        { kind: "paragraph", text: "segundo" },
      ],
    },
    {
      name: "consecutive lines stay in one paragraph",
      source: "linha 1\nlinha 2",
      expected: [{ kind: "paragraph", text: "linha 1\nlinha 2" }],
    },
    {
      name: "a bullet list with stars",
      source: "* um\n* dois",
      expected: [{ kind: "list", ordered: false, start: 1, items: ["um", "dois"] }],
    },
    {
      name: "a bullet list with dashes",
      source: "- um\n- dois",
      expected: [{ kind: "list", ordered: false, start: 1, items: ["um", "dois"] }],
    },
    {
      name: "a numbered list keeps its first number",
      source: "3. terceiro\n4. quarto",
      expected: [{ kind: "list", ordered: true, start: 3, items: ["terceiro", "quarto"] }],
    },
    {
      name: "a text line before a list",
      source: "Itens:\n\n* um",
      expected: [
        { kind: "paragraph", text: "Itens:" },
        { kind: "list", ordered: false, start: 1, items: ["um"] },
      ],
    },
    {
      name: "an indented line continues the previous item",
      source: "1. **INC-1** - Título\n   - Status: Aberto\n2. **INC-2** - Outro",
      expected: [
        {
          kind: "list",
          ordered: true,
          start: 1,
          items: ["INC-1 - Título\nStatus: Aberto", "INC-2 - Outro"],
        },
      ],
    },
    {
      name: "switching from numbered to bullets starts a new list",
      source: "1. a\n* b",
      expected: [
        { kind: "list", ordered: true, start: 1, items: ["a"] },
        { kind: "list", ordered: false, start: 1, items: ["b"] },
      ],
    },
    {
      name: "bold at the start of a line is not a list",
      source: "**Atenção** isto",
      expected: [{ kind: "paragraph", text: "Atenção isto" }],
    },
    {
      name: "windows line breaks",
      source: "a\r\n\r\nb",
      expected: [
        { kind: "paragraph", text: "a" },
        { kind: "paragraph", text: "b" },
      ],
    },
    { name: "empty text", source: "", expected: [] },
  ])("$name", ({ source, expected }) => {
    expect(simplify(source)).toEqual(expected);
  });

  it("gives every block, item and span a unique key", () => {
    const blocks = parseMarkdown("Olá **mundo**\n\n* um *dois*\n* três");
    const keys = blocks.flatMap((block) =>
      block.kind === "paragraph"
        ? [block.key, ...block.inlines.map((inline) => inline.key)]
        : [
            block.key,
            ...block.items.flatMap((item) => [
              item.key,
              ...item.inlines.map((inline) => inline.key),
            ]),
          ],
    );

    expect(new Set(keys).size).toBe(keys.length);
  });
});
