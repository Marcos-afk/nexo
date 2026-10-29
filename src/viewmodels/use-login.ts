import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { toast } from "sonner";
import { DEFAULT_LOGIN_VALUES, LOGIN_ENDPOINT } from "@/constants/auth";
import { api } from "@/lib/api";
import type { LoginFormValues } from "@/models/auth";
import { loginResponseSchema, loginSchema } from "@/schemas/auth";
import { errorMessageOf } from "@/utils/error-message";
import { homePathFor } from "@/utils/home-path";

const UNEXPECTED_ERROR = "Algo deu errado ao entrar. Tente novamente.";

export function useLogin() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: DEFAULT_LOGIN_VALUES,
  });

  const { errors, isSubmitting } = useFormState({ control: form.control });

  const authenticate = async (values: LoginFormValues) => {
    try {
      const { user } = await api.post(LOGIN_ENDPOINT, values, loginResponseSchema);

      setRedirecting(true);
      router.replace(homePathFor(user.role));
      router.refresh();
    } catch (error) {
      toast.error(errorMessageOf(error, UNEXPECTED_ERROR));
    }
  };

  const handleSubmit = form.handleSubmit(authenticate);

  return {
    form,
    errors,
    showPassword,
    isSubmitting: isSubmitting || redirecting,
    toggleShowPassword: () => setShowPassword((visible) => !visible),
    onSubmit: (event: SubmitEvent) => void handleSubmit(event),
  };
}
