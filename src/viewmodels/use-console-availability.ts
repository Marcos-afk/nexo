import { useState } from "react";
import { toast } from "sonner";
import { AVAILABILITY_ENDPOINT, AVAILABILITY_ERROR, NEXT_AVAILABILITY } from "@/constants/console";
import type { AnalystAvailability } from "@/domain/console";
import { api } from "@/lib/api";
import { availabilityResponseSchema } from "@/schemas/console";
import { errorMessageOf } from "@/utils/error-message";

export function useConsoleAvailability(initial: AnalystAvailability) {
  const [availability, setAvailability] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = async () => {
    setIsSaving(true);

    try {
      const next = await api.patch(
        AVAILABILITY_ENDPOINT,
        { availability: NEXT_AVAILABILITY[availability] },
        availabilityResponseSchema,
      );

      setAvailability(next.availability);
    } catch (error) {
      toast.error(errorMessageOf(error, AVAILABILITY_ERROR));
    } finally {
      setIsSaving(false);
    }
  };

  return { availability, isSaving, onToggle: () => void toggle() };
}
