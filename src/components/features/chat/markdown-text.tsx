import type { ReactNode } from "react";
import type { MarkdownInlineKind, MarkdownInlineProps } from "@/models/markdown";
import { parseMarkdown } from "@/utils/markdown";

interface SpanViewProps {
  readonly text: string;
}

type SpanView = (props: SpanViewProps) => ReactNode;

const SPAN_VIEWS = {
  text: ({ text }) => text,
  bold: ({ text }) => <strong className="font-semibold">{text}</strong>,
  italic: ({ text }) => <em>{text}</em>,
  code: ({ text }) => <code className="rounded-sm bg-card px-1 font-data text-xs">{text}</code>,
} as const satisfies Record<MarkdownInlineKind, SpanView>;

interface InlinesProps {
  readonly inlines: readonly MarkdownInlineProps[];
}

function Inlines({ inlines }: InlinesProps) {
  return inlines.map((inline) => {
    const View = SPAN_VIEWS[inline.kind];

    return <View key={inline.key} text={inline.text} />;
  });
}

interface MarkdownTextProps {
  readonly text: string;
}

export function MarkdownText({ text }: MarkdownTextProps) {
  return parseMarkdown(text).map((block) => {
    if (block.kind === "paragraph") {
      return (
        <p key={block.key} className="whitespace-pre-wrap">
          <Inlines inlines={block.inlines} />
        </p>
      );
    }

    const List = block.ordered ? "ol" : "ul";

    return (
      <List
        key={block.key}
        start={block.ordered ? block.start : undefined}
        className={`flex flex-col gap-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
      >
        {block.items.map((item) => (
          <li key={item.key} className="whitespace-pre-wrap">
            <Inlines inlines={item.inlines} />
          </li>
        ))}
      </List>
    );
  });
}
