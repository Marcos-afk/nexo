"use client";

import { Check, KeyRound, Loader2, Mail, RotateCcwKey } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CARD_CLASS } from "@/constants/chat";
import { usePasswordReset } from "@/viewmodels/use-password-reset";

const ICON_SIZE = 18;
const BUTTON_ICON_SIZE = 15;
const HELPER_ICON_SIZE = 14;

interface PasswordCardProps {
  readonly ageLabel: string;
  readonly email: string;
}

export function PasswordCard({ ageLabel, email }: PasswordCardProps) {
  const { isRequesting, isRequested, onRequest } = usePasswordReset();

  return (
    <section aria-label="Senha" className={CARD_CLASS}>
      <div className="flex flex-wrap items-center gap-4 px-6 py-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-desk text-ink-2">
          <KeyRound size={ICON_SIZE} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <h2 className="text-[14.5px] font-semibold text-ink">Senha</h2>
          <p className="text-sm text-ink-3">{ageLabel}</p>
        </div>
        <Button.Root
          variant="outline"
          onClick={onRequest}
          disabled={isRequesting || isRequested}
          className="h-9 gap-1.75 rounded-lg pr-3.5 pl-3 text-ink-2!"
        >
          {isRequesting && (
            <Loader2 size={BUTTON_ICON_SIZE} aria-hidden="true" className="animate-spin" />
          )}
          {isRequested && <Check size={BUTTON_ICON_SIZE} aria-hidden="true" />}
          {!isRequesting && !isRequested && (
            <RotateCcwKey size={BUTTON_ICON_SIZE} aria-hidden="true" />
          )}
          {isRequested ? "Link solicitado" : "Redefinir senha"}
        </Button.Root>
      </div>
      <div
        role="status"
        className="flex flex-col gap-1 rounded-b-2xl border-t border-rule bg-desk px-6 py-3 text-[13px] text-ink-3"
      >
        <p className="flex items-center gap-2">
          <Mail size={HELPER_ICON_SIZE} aria-hidden="true" className="shrink-0" />
          {isRequested
            ? `Solicitação registrada. Enviaremos um link de redefinição para ${email}`
            : `Enviaremos um link de redefinição para ${email}`}
        </p>
        {isRequested && (
          <p className="text-xs">
            Demonstração: nenhum e-mail real é enviado, e o Nexo aceita qualquer senha para entrar.
          </p>
        )}
      </div>
    </section>
  );
}
