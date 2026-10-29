import type {
  MarkdownBlockProps,
  MarkdownInlineKind,
  MarkdownInlineProps,
  MarkdownSpanProps,
} from "@/models/markdown";

type MarkedKind = Exclude<MarkdownInlineKind, "text">;

type RawBlock =
  | { readonly kind: "paragraph"; readonly lines: readonly string[] }
  | {
      readonly kind: "list";
      readonly ordered: boolean;
      readonly start: number;
      readonly items: readonly string[];
    };

interface ParseState {
  readonly blocks: readonly RawBlock[];
  readonly isOpen: boolean;
}

interface ListLine {
  readonly indent: number;
  readonly ordered: boolean;
  readonly number: number;
  readonly content: string;
}

const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^\s*][^*\n]*\*)/;
const LIST_LINE_PATTERN = /^(\s*)(?:[*-]|(\d+)\.)\s+(.*)$/;
const CONTINUATION_INDENT = 2;
const DEFAULT_START = 1;
const MARKER_LENGTH = { bold: 2, italic: 1, code: 1 } as const satisfies Record<MarkedKind, number>;

const markedKindOf = (token: string): MarkedKind => {
  if (token.startsWith("**")) {
    return "bold";
  }

  return token.startsWith("`") ? "code" : "italic";
};

const markedSpanOf = (token: string): MarkdownSpanProps => {
  const kind = markedKindOf(token);
  const length = MARKER_LENGTH[kind];

  return { kind, text: token.slice(length, token.length - length) };
};

export const parseInline = (text: string): MarkdownSpanProps[] =>
  text
    .split(INLINE_PATTERN)
    .map(
      (part, index): MarkdownSpanProps =>
        index % 2 === 1 ? markedSpanOf(part) : { kind: "text", text: part },
    )
    .filter((span) => span.text.length > 0);

const keyedInlines = (text: string, keyPrefix: string): MarkdownInlineProps[] =>
  parseInline(text).map((span, index) => ({ ...span, key: `${keyPrefix}-${index}` }));

const listLineOf = (line: string): ListLine | null => {
  const match = LIST_LINE_PATTERN.exec(line);

  if (!match) {
    return null;
  }

  const [, indent = "", number, content = ""] = match;

  return {
    indent: indent.length,
    ordered: number !== undefined,
    number: number === undefined ? DEFAULT_START : Number(number),
    content,
  };
};

const withLast = (blocks: readonly RawBlock[], last: RawBlock): RawBlock[] => [
  ...blocks.slice(0, -1),
  last,
];

const appendItem = (list: Extract<RawBlock, { kind: "list" }>, item: string): RawBlock => ({
  ...list,
  items: [...list.items, item],
});

const extendLastItem = (list: Extract<RawBlock, { kind: "list" }>, text: string): RawBlock => ({
  ...list,
  items: [...list.items.slice(0, -1), `${list.items.at(-1) ?? ""}\n${text}`],
});

const addListLine = (state: ParseState, listLine: ListLine): ParseState => {
  const last = state.blocks.at(-1);

  if (state.isOpen && last?.kind === "list" && last.ordered === listLine.ordered) {
    return { blocks: withLast(state.blocks, appendItem(last, listLine.content)), isOpen: true };
  }

  const list: RawBlock = {
    kind: "list",
    ordered: listLine.ordered,
    start: listLine.number,
    items: [listLine.content],
  };

  return { blocks: [...state.blocks, list], isOpen: true };
};

const continueBlock = (state: ParseState, line: string, listLine: ListLine | null): ParseState => {
  const last = state.blocks.at(-1);

  if (state.isOpen && last?.kind === "list") {
    const extended = extendLastItem(last, listLine?.content ?? line.trim());

    return { blocks: withLast(state.blocks, extended), isOpen: true };
  }

  if (state.isOpen && last?.kind === "paragraph") {
    return {
      blocks: withLast(state.blocks, { ...last, lines: [...last.lines, line] }),
      isOpen: true,
    };
  }

  return { blocks: [...state.blocks, { kind: "paragraph", lines: [line] }], isOpen: true };
};

const step = (state: ParseState, line: string): ParseState => {
  if (line.trim() === "") {
    return { ...state, isOpen: false };
  }

  const listLine = listLineOf(line);

  return listLine && listLine.indent < CONTINUATION_INDENT
    ? addListLine(state, listLine)
    : continueBlock(state, line, listLine);
};

const blockOf = (block: RawBlock, index: number): MarkdownBlockProps => {
  const key = `b${index}`;

  if (block.kind === "paragraph") {
    return { kind: "paragraph", key, inlines: keyedInlines(block.lines.join("\n"), key) };
  }

  return {
    kind: "list",
    key,
    ordered: block.ordered,
    start: block.start,
    items: block.items.map((item, itemIndex) => ({
      key: `${key}-${itemIndex}`,
      inlines: keyedInlines(item, `${key}-${itemIndex}`),
    })),
  };
};

export const parseMarkdown = (source: string): MarkdownBlockProps[] =>
  source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .reduce<ParseState>(step, { blocks: [], isOpen: false })
    .blocks.map(blockOf);
