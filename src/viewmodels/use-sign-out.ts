import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LOGOUT_ENDPOINT } from "@/constants/auth";
import { LOGIN_PATH } from "@/constants/routes";
import { api } from "@/lib/api";
import { logoutResponseSchema } from "@/schemas/auth";
import { errorMessageOf } from "@/utils/error-message";

const UNEXPECTED_ERROR = "Não foi possível sair agora. Tente novamente.";

export function useSignOut() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);

    try {
      await api.post(LOGOUT_ENDPOINT, undefined, logoutResponseSchema);

      router.replace(LOGIN_PATH);
      router.refresh();
    } catch (error) {
      setIsSigningOut(false);
      toast.error(errorMessageOf(error, UNEXPECTED_ERROR));
    }
  };

  return { isSigningOut, onSignOut: () => void signOut() };
}
