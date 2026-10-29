import { cx } from "class-variance-authority";
import type { ChatNoticeProps, ChatNoticeToneType } from "@/models/chat";

const NOTICE_CLASSES = {
  info: "bg-primary-soft text-primary-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
} as const satisfies Record<ChatNoticeToneType, string>;

interface ChatNoticeViewProps {
  readonly notice: ChatNoticeProps;
}

export function ChatNotice({ notice }: ChatNoticeViewProps) {
  return (
    <p role="status" className={cx("rounded-lg px-3.5 py-2 text-sm", NOTICE_CLASSES[notice.tone])}>
      {notice.text}
    </p>
  );
}
