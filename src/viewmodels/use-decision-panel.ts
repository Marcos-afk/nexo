import { useEffect, useState } from "react";
import { DECISION_ENDPOINT } from "@/constants/decision";
import { ApiError, api } from "@/lib/api";
import type { DecisionStateType } from "@/models/decision";
import { decisionResponseSchema } from "@/schemas/decision";

const NOT_FOUND_STATUS = 404;

const CLOSED: DecisionStateType = { kind: "closed" };
const LOADING: DecisionStateType = { kind: "loading" };

const failureStateOf = (error: unknown): DecisionStateType =>
  error instanceof ApiError && error.status === NOT_FOUND_STATUS
    ? { kind: "empty" }
    : { kind: "error" };

export interface DecisionPanel {
  readonly state: DecisionStateType;
  readonly isOpen: boolean;
  readonly toggle: () => void;
}

export function useDecisionPanel(messageId: string): DecisionPanel {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<DecisionStateType>(CLOSED);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const controller = new AbortController();
    setState(LOADING);

    api
      .get(
        `${DECISION_ENDPOINT}/${encodeURIComponent(messageId)}`,
        decisionResponseSchema,
        controller.signal,
      )
      .then(({ decision }) => setState({ kind: "ready", decision }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState(failureStateOf(error));
        }
      });

    return () => controller.abort();
  }, [isOpen, messageId]);

  return { state, isOpen, toggle: () => setIsOpen((current) => !current) };
}
