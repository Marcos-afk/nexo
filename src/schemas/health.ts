import { z } from "zod";
import { assistantStatuses } from "@/domain/health";
import type { HealthResponseProps } from "@/models/health";

export const healthResponseSchema = z.object({
  health: z.object({ status: z.enum(assistantStatuses) }),
}) satisfies z.ZodType<HealthResponseProps>;
