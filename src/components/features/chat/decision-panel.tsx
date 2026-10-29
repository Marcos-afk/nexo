import { ChevronDown } from "lucide-react";
import {
  DECISION_CLOSE_LABEL,
  DECISION_EMPTY_LABEL,
  DECISION_ERROR_LABEL,
  DECISION_LOADING_LABEL,
  DECISION_OPEN_LABEL,
} from "@/constants/decision";
import type { DecisionStateType } from "@/models/decision";
import { useDecisionPanel } from "@/viewmodels/use-decision-panel";
import { DecisionDetails } from "./decision-details";

const ICON_SIZE = 12;

interface DecisionBodyProps {
  readonly state: DecisionStateType;
}

function DecisionBody({ state }: DecisionBodyProps) {
  switch (state.kind) {
    case "ready":
      return <DecisionDetails decision={state.decision} />;
    case "empty":
      return <p className="text-sm text-ink-3">{DECISION_EMPTY_LABEL}</p>;
    case "error":
      return <p className="text-sm text-danger-text">{DECISION_ERROR_LABEL}</p>;
    default:
      return <p className="text-sm text-ink-3">{DECISION_LOADING_LABEL}</p>;
  }
}

interface DecisionPanelProps {
  readonly messageId: string;
  readonly initiallyOpen?: boolean;
}

export function DecisionPanel({ messageId, initiallyOpen = false }: DecisionPanelProps) {
  const { state, isOpen, toggle } = useDecisionPanel(messageId, initiallyOpen);
  const regionId = `decision-${messageId}`;

  return (
    <div className="flex max-w-150 flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={regionId}
        className="flex w-fit cursor-pointer items-center gap-1 text-xs text-ink-3 hover:text-ink"
      >
        {isOpen ? DECISION_CLOSE_LABEL : DECISION_OPEN_LABEL}
        <ChevronDown
          size={ICON_SIZE}
          aria-hidden="true"
          className={isOpen ? "rotate-180" : undefined}
        />
      </button>
      {isOpen && (
        <section
          id={regionId}
          aria-label="Decisão do Nexo Assist"
          className="rounded-xl border border-rule bg-paper px-4 py-3"
        >
          <DecisionBody state={state} />
        </section>
      )}
    </div>
  );
}
