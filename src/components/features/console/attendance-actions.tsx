"use client";

import { Bot, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CANCEL_LABEL,
  CLOSE_LABEL,
  CONFIRM_CLOSE_LABEL,
  OPEN_TICKET_WARNING,
  RETURN_LABEL,
} from "@/constants/console";
import type { ConversationActionsProps } from "@/models/console";
import { useCloseConfirmation } from "@/viewmodels/use-close-confirmation";

interface AttendanceActionsProps {
  readonly actions: ConversationActionsProps;
  readonly needsConfirmation: boolean;
}

const ICON_SIZE = 14;

export function AttendanceActions({ actions, needsConfirmation }: AttendanceActionsProps) {
  const { isConfirming, onCloseClick, onCancel } = useCloseConfirmation({
    needsConfirmation,
    onClose: actions.onClose,
  });

  if (isConfirming) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <p role="alert" className="text-xs text-warning-text">
          {OPEN_TICKET_WARNING}
        </p>
        <Button.Root variant="ghost" onClick={onCancel} className="h-9 rounded-lg px-3.5">
          {CANCEL_LABEL}
        </Button.Root>
        <Button.Root
          onClick={actions.onClose}
          disabled={actions.isBusy}
          className="h-9 rounded-lg px-3.5"
        >
          {CONFIRM_CLOSE_LABEL}
        </Button.Root>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button.Root
        variant="outline"
        onClick={actions.onReturn}
        disabled={actions.isBusy}
        className="h-9 gap-1.5 rounded-lg pr-3 pl-2.5"
      >
        <Bot size={ICON_SIZE} aria-hidden="true" className="text-ink-2" />
        {RETURN_LABEL}
      </Button.Root>
      <Button.Root
        variant="danger"
        onClick={onCloseClick}
        disabled={actions.isBusy}
        className="h-9 gap-1.5 rounded-lg pr-3 pl-2.5"
      >
        <CircleCheckBig size={ICON_SIZE} aria-hidden="true" />
        {CLOSE_LABEL}
      </Button.Root>
    </div>
  );
}
