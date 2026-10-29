import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DECISION_NO_TOOLS_LABEL,
  INTENT_LABELS,
  SIGNAL_LABELS,
  TOOL_LABELS,
} from "@/constants/decision";
import type { DecisionProps } from "@/models/decision";
import {
  actionLabelOf,
  durationLabelOf,
  inputLabelOf,
  tokensLabelOf,
} from "@/utils/decision-format";

const ICON_SIZE = 12;

interface FieldProps {
  readonly label: string;
  readonly children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

interface ToolListProps {
  readonly toolCalls: DecisionProps["toolCalls"];
}

function ToolList({ toolCalls }: ToolListProps) {
  if (toolCalls.length === 0) {
    return <p className="text-sm text-ink-3">{DECISION_NO_TOOLS_LABEL}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {toolCalls.map((tool) => (
        <li
          key={tool.callId}
          className="flex flex-col gap-0.5 rounded-md bg-card px-3 py-2 text-xs"
        >
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            {tool.failed ? (
              <X size={ICON_SIZE} aria-hidden="true" className="text-danger" />
            ) : (
              <Check size={ICON_SIZE} aria-hidden="true" className="text-success" />
            )}
            {TOOL_LABELS[tool.name] ?? tool.name}
            <span className="font-normal text-ink-3">{durationLabelOf(tool.durationMs)}</span>
          </span>
          <span className="font-data break-all text-ink-3">{inputLabelOf(tool.input)}</span>
          {tool.summary && <span className="text-ink-2">{tool.summary}</span>}
        </li>
      ))}
    </ul>
  );
}

interface DecisionDetailsProps {
  readonly decision: DecisionProps;
}

export function DecisionDetails({ decision }: DecisionDetailsProps) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Field label="Intenção">{INTENT_LABELS[decision.intent]}</Field>
        <Field label="Ação">{actionLabelOf(decision.action)}</Field>
        <Field label="Confiança">{decision.confidence}%</Field>
        <Field label="Modelo">
          <span className="font-data text-xs">{decision.model}</span>
        </Field>
        <Field label="Tokens (entrada / saída)">
          {tokensLabelOf(decision.tokensIn)} / {tokensLabelOf(decision.tokensOut)}
        </Field>
        <Field label="Latência">{durationLabelOf(decision.latencyMs)}</Field>
      </dl>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-ink-3">O que entendeu</span>
        <p className="text-sm text-ink">{decision.understood}</p>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-ink-3">Por quê</span>
        <p className="text-sm text-ink-2">{decision.rationale}</p>
        <div className="flex flex-wrap gap-1.5">
          {decision.signals.map((signal) => (
            <Badge.Root key={signal}>{SIGNAL_LABELS[signal]}</Badge.Root>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-ink-3">Ferramentas</span>
        <ToolList toolCalls={decision.toolCalls} />
      </div>
    </div>
  );
}
