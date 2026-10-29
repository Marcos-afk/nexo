import { useState } from "react";
import { toast } from "sonner";
import { HANDOFF_ENDPOINT, HANDOFF_ERROR } from "@/constants/chat";
import type { ConversationMode } from "@/domain/conversation";
import { api } from "@/lib/api";
import { handoffResponseSchema } from "@/schemas/chat";
import { errorMessageOf } from "@/utils/error-message";

export function useAnalystRequest(onTransferred: (mode: ConversationMode) => void) {
  const [isRequestingAnalyst, setIsRequestingAnalyst] = useState(false);

  const request = async () => {
    setIsRequestingAnalyst(true);

    try {
      const { mode } = await api.post(HANDOFF_ENDPOINT, undefined, handoffResponseSchema);

      onTransferred(mode);
    } catch (error) {
      toast.error(errorMessageOf(error, HANDOFF_ERROR));
    } finally {
      setIsRequestingAnalyst(false);
    }
  };

  return { isRequestingAnalyst, onRequestAnalyst: () => void request() };
}
