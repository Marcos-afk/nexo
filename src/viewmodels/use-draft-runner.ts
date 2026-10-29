import { useState } from "react";
import { DRAFT_ACTION_ERROR } from "@/constants/ticket";
import { errorMessageOf } from "@/utils/error-message";

export function useDraftRunner() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setIsWorking(true);
    setActionError(null);

    try {
      await action();

      return true;
    } catch (error) {
      setActionError(errorMessageOf(error, DRAFT_ACTION_ERROR));

      return false;
    } finally {
      setIsWorking(false);
    }
  };

  return { actionError, isWorking, run };
}
