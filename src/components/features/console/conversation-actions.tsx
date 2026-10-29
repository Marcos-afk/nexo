"use client";

import type { ConsoleConversationProps, ConversationActionsProps } from "@/models/console";
import { isAssignedToViewer, needsCloseConfirmation } from "@/utils/console-conversation";
import { useCopySummary } from "@/viewmodels/use-copy-summary";
import { AttendanceActions } from "./attendance-actions";
import { HeaderMenu } from "./header-menu";

interface ConversationActionsComponentProps {
  readonly conversation: ConsoleConversationProps;
  readonly actions: ConversationActionsProps;
  readonly isPanelOpen: boolean;
  readonly onTogglePanel: () => void;
  readonly onSearch: () => void;
}

export function ConversationActions({
  conversation,
  actions,
  isPanelOpen,
  onTogglePanel,
  onSearch,
}: ConversationActionsComponentProps) {
  const { onCopy } = useCopySummary(conversation);

  return (
    <>
      {isAssignedToViewer(conversation) && (
        <AttendanceActions
          actions={actions}
          needsConfirmation={needsCloseConfirmation(conversation)}
        />
      )}
      <HeaderMenu
        isPanelOpen={isPanelOpen}
        onTogglePanel={onTogglePanel}
        onCopySummary={onCopy}
        onSearch={onSearch}
      />
    </>
  );
}
