import { toast } from "sonner";
import { COPY_SUMMARY_DONE, COPY_SUMMARY_ERROR } from "@/constants/console";
import type { ConsoleConversationProps } from "@/models/console";
import { buildCaseSummary } from "@/utils/console-conversation";

export function useCopySummary(conversation: ConsoleConversationProps) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildCaseSummary(conversation));
      toast.success(COPY_SUMMARY_DONE);
    } catch {
      toast.error(COPY_SUMMARY_ERROR);
    }
  };

  return { onCopy: () => void copy() };
}
