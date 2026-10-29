import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitEvent, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { toast } from "sonner";
import { FORGOT_PASSWORD_ENDPOINT } from "@/constants/auth";
import { api } from "@/lib/api";
import type { ForgotPasswordFormValues } from "@/models/auth";
import { forgotPasswordResponseSchema, forgotPasswordSchema } from "@/schemas/auth";
import { errorMessageOf } from "@/utils/error-message";

const UNEXPECTED_ERROR = "Não foi possível enviar o link agora. Tente novamente.";

export function useForgotPassword() {
  const [requestedEmail, setRequestedEmail] = useState<string | null>(null);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });

  const request = form.handleSubmit(async (values) => {
    try {
      await api.post(FORGOT_PASSWORD_ENDPOINT, values, forgotPasswordResponseSchema);

      setRequestedEmail(values.email);
    } catch (error) {
      toast.error(errorMessageOf(error, UNEXPECTED_ERROR));
    }
  });

  return {
    form,
    errors,
    isSubmitting,
    requestedEmail,
    onSubmit: (event: SubmitEvent) => void request(event),
  };
}
