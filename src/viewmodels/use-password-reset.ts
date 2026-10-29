import { useState } from "react";
import { toast } from "sonner";
import { PASSWORD_RESET_ENDPOINT } from "@/constants/auth";
import { api } from "@/lib/api";
import { forgotPasswordResponseSchema } from "@/schemas/auth";
import { errorMessageOf } from "@/utils/error-message";

const UNEXPECTED_ERROR = "Não foi possível solicitar a redefinição agora. Tente novamente.";

export function usePasswordReset() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isRequested, setIsRequested] = useState(false);

  const request = async () => {
    setIsRequesting(true);

    try {
      await api.post(PASSWORD_RESET_ENDPOINT, undefined, forgotPasswordResponseSchema);

      setIsRequested(true);
    } catch (error) {
      toast.error(errorMessageOf(error, UNEXPECTED_ERROR));
    } finally {
      setIsRequesting(false);
    }
  };

  return { isRequesting, isRequested, onRequest: () => void request() };
}
