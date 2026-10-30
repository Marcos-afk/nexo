import { useState } from "react";
import { toast } from "sonner";
import { ACTION_ERROR, conversationPathOf } from "@/constants/console";
import { api } from "@/lib/api";
import type { ConversationActionsProps } from "@/models/console";
import { actionResponseSchema } from "@/schemas/console";
import { errorMessageOf } from "@/utils/error-message";

interface UseConversationActionsProps {
  readonly conversationId: string;
  readonly onDone: () => Promise<void>;
}

export function useConversationActions({
  conversationId,
  onDone,
}: UseConversationActionsProps): ConversationActionsProps {
  const [isBusy, setIsBusy] = useState(false);

  const run = async (path: string, body?: unknown): Promise<boolean> => {
    setIsBusy(true);

    try {
      await api.post(`${conversationPathOf(conversationId)}/${path}`, body, actionResponseSchema);

      return true;
    } catch (error) {
      toast.error(errorMessageOf(error, ACTION_ERROR));

      return false;
    } finally {
      await onDone();
      setIsBusy(false);
    }
  };

  return {
    isBusy,
    onAssume: () => void run("assume"),
    onReturn: () => void run("return"),
    onClose: () => void run("close"),
    onReply: (content) => run("messages", { content }),
  };
}
