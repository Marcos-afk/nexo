import { cx } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REQUEST_ANALYST_LABEL } from "@/constants/chat";
import type { ChatNoticeProps, ChatNoticeToneType } from "@/models/chat";

const ICON_SIZE = 14;

const NOTICE_CLASSES = {
  info: "bg-primary-soft text-primary-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
} as const satisfies Record<ChatNoticeToneType, string>;

interface ChatNoticeViewProps {
  readonly notice: ChatNoticeProps;
  readonly isWorking: boolean;
  readonly onAction: () => void;
}

export function ChatNotice({ notice, isWorking, onAction }: ChatNoticeViewProps) {
  return (
    <div
      role="status"
      className={cx(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg px-3.5 py-2 text-sm",
        NOTICE_CLASSES[notice.tone],
      )}
    >
      <p>{notice.text}</p>
      {notice.action && (
        <Button.Root
          variant="outline"
          onClick={onAction}
          disabled={isWorking}
          className="h-8 rounded-lg px-3 text-xs"
        >
          {isWorking && <Loader2 size={ICON_SIZE} aria-hidden="true" className="animate-spin" />}
          {REQUEST_ANALYST_LABEL}
        </Button.Root>
      )}
    </div>
  );
}
