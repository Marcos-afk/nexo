import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { TYPING_LABEL } from "@/constants/console";
import type { ConsoleConversationProps } from "@/models/console";
import { isAssignedToViewer, modeBadgeOf } from "@/utils/console-conversation";
import { avatarToneOf } from "@/utils/console-format";
import { getUserAcronym } from "@/utils/get-user-acronym";

interface ConversationHeaderProps {
  readonly conversation: ConsoleConversationProps;
  readonly isTyping: boolean;
  readonly actions: ReactNode;
}

export function ConversationHeader({ conversation, isTyping, actions }: ConversationHeaderProps) {
  const tone = avatarToneOf(conversation.employee.id);
  const badge = modeBadgeOf(conversation);
  const subtitle = [conversation.employee.department, conversation.ticket?.number]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="flex h-16 items-center gap-3 border-b border-rule pr-4 pl-5">
      <span
        aria-hidden="true"
        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-[14.5px] font-semibold ${tone.background} ${tone.text}`}
      >
        {getUserAcronym(conversation.employee.name)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="truncate text-[15.5px] font-semibold text-ink">
          {conversation.employee.name}
        </h1>
        <p className="flex items-center gap-1.5 truncate text-xs text-ink-3">
          {isTyping && <span className="text-success-text italic">{TYPING_LABEL}</span>}
          {!isTyping && conversation.employeeOnline && (
            <span className="flex items-center gap-1 font-semibold text-success-text">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
              online
            </span>
          )}
          {subtitle}
        </p>
      </div>
      {!isAssignedToViewer(conversation) && (
        <div className="flex items-center gap-1.5">
          <Badge.Root tone={badge.tone}>{badge.text}</Badge.Root>
          {conversation.handoffLevel && conversation.mode === "awaiting_analyst" && (
            <Badge.Root tone="violet">Suporte {conversation.handoffLevel}</Badge.Root>
          )}
        </div>
      )}
      {actions}
    </header>
  );
}
