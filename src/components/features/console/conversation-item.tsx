import { cx } from "class-variance-authority";
import Link from "next/link";
import { conversationHrefOf, NO_MESSAGES_LABEL, TYPING_LABEL } from "@/constants/console";
import { TONE_DOT_CLASSES, TONE_TEXT_CLASSES } from "@/constants/ticket";
import type { ConsoleItemProps, ConsoleLabelViewProps } from "@/models/console";
import { avatarToneOf, labelViewOf, timeLabelOf } from "@/utils/console-format";
import { getUserAcronym } from "@/utils/get-user-acronym";

interface ConversationItemProps {
  readonly item: ConsoleItemProps;
  readonly isSelected: boolean;
  readonly isTyping: boolean;
  readonly now: Date | null;
}

interface LabelTagProps {
  readonly label: ConsoleLabelViewProps;
}

function LabelTag({ label }: LabelTagProps) {
  return (
    <span
      className={cx(
        "flex items-center gap-1.25 text-[11.5px] font-medium",
        TONE_TEXT_CLASSES[label.tone],
      )}
    >
      <span
        aria-hidden="true"
        className={cx("size-1.5 rounded-full", TONE_DOT_CLASSES[label.tone])}
      />
      {label.text}
    </span>
  );
}

interface ItemHeadingProps {
  readonly name: string;
  readonly hasUnread: boolean;
  readonly time: string | null;
}

function ItemHeading({ name, hasUnread, time }: ItemHeadingProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cx(
          "min-w-0 flex-1 truncate text-[15.5px] text-ink",
          hasUnread ? "font-semibold" : "font-medium",
        )}
      >
        {name}
      </span>
      {time && (
        <time className={cx("text-xs", hasUnread ? "font-semibold text-cta" : "text-ink-3")}>
          {time}
        </time>
      )}
    </div>
  );
}

interface ItemPreviewProps {
  readonly text: string;
  readonly isTyping: boolean;
  readonly unread: number;
}

function ItemPreview({ text, isTyping, unread }: ItemPreviewProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cx(
          "min-w-0 flex-1 truncate text-sm",
          isTyping ? "text-success-text italic" : "text-ink-3",
        )}
      >
        {isTyping ? TYPING_LABEL : text}
      </span>
      {unread > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1.5 text-[11.5px] font-bold text-white">
          <span className="sr-only">Não lidas: </span>
          {unread}
        </span>
      )}
    </div>
  );
}

export function ConversationItem({ item, isSelected, isTyping, now }: ConversationItemProps) {
  const tone = avatarToneOf(item.employee.id);
  const lastAt = item.preview?.at ?? item.updatedAt;
  const decisionId =
    item.label.kind === "agent_asked_help" ? item.label.decisionMessageId : undefined;

  return (
    <li>
      <Link
        href={conversationHrefOf(item.id, decisionId)}
        aria-current={isSelected ? "page" : undefined}
        className={cx(
          "flex items-center gap-3 rounded-xl p-2.5 hover:bg-desk focus-visible:outline-2 focus-visible:outline-primary",
          isSelected && "bg-desk",
        )}
      >
        <span
          aria-hidden="true"
          className={`flex size-11.5 shrink-0 items-center justify-center rounded-full text-[15.5px] font-semibold ${tone.background} ${tone.text}`}
        >
          {getUserAcronym(item.employee.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.75 border-b border-rule pb-2.5">
          <ItemHeading
            name={item.employee.name}
            hasUnread={item.unread > 0}
            time={now ? timeLabelOf(lastAt, now) : null}
          />
          <ItemPreview
            text={item.preview?.text ?? NO_MESSAGES_LABEL}
            isTyping={isTyping}
            unread={item.unread}
          />
          <LabelTag label={labelViewOf(item.label, now)} />
        </div>
      </Link>
    </li>
  );
}
