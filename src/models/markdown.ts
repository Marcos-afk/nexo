export type MarkdownInlineKind = "text" | "bold" | "italic" | "code";

export interface MarkdownSpanProps {
  readonly kind: MarkdownInlineKind;
  readonly text: string;
}

export interface MarkdownInlineProps extends MarkdownSpanProps {
  readonly key: string;
}

export interface MarkdownItemProps {
  readonly key: string;
  readonly inlines: readonly MarkdownInlineProps[];
}

export type MarkdownBlockProps =
  | {
      readonly kind: "paragraph";
      readonly key: string;
      readonly inlines: readonly MarkdownInlineProps[];
    }
  | {
      readonly kind: "list";
      readonly key: string;
      readonly ordered: boolean;
      readonly start: number;
      readonly items: readonly MarkdownItemProps[];
    };
