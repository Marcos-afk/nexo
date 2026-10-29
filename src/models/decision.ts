import type { ToolTraceEntry } from "@/domain/tool-trace";
import type { TriageIntent, TriageSignal } from "@/domain/triage";

export interface DecisionProps {
  readonly messageId: string;
  readonly intent: TriageIntent;
  readonly understood: string;
  readonly action: string;
  readonly confidence: number;
  readonly rationale: string;
  readonly signals: readonly TriageSignal[];
  readonly toolCalls: readonly ToolTraceEntry[];
  readonly model: string;
  readonly tokensIn: number | null;
  readonly tokensOut: number | null;
  readonly latencyMs: number | null;
}

export interface DecisionResponseProps {
  readonly decision: DecisionProps;
}

export type DecisionStateType =
  | { readonly kind: "closed" }
  | { readonly kind: "loading" }
  | { readonly kind: "empty" }
  | { readonly kind: "error" }
  | { readonly kind: "ready"; readonly decision: DecisionProps };
