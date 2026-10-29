import type { AssistantStatus } from "@/domain/health";

export interface HealthResponseProps {
  readonly health: {
    readonly status: AssistantStatus;
  };
}
