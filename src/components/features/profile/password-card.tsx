"use client";

import { Check, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePasswordReset } from "@/viewmodels/use-password-reset";

const ICON_SIZE = 16;

interface PasswordCardProps {
  readonly ageLabel: string;
  readonly email: string;
}

export function PasswordCard({ ageLabel, email }: PasswordCardProps) {
  const { isRequesting, isRequested, onRequest } = usePasswordReset();

  return (
    <section aria-label="Senha" className="rounded-2xl border border-ink/10 bg-paper">
      <div className="flex flex-wrap items-center gap-4 px-6 py-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-desk text-ink-2">
          <KeyRound size={ICON_SIZE} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <h2 className="text-sm font-semibold text-ink">Senha</h2>
          <p className="text-sm text-ink-3">{ageLabel}</p>
        </div>
        <Button.Root
          variant="outline"
          onClick={onRequest}
          disabled={isRequesting || isRequested}
          className="h-9 rounded-lg pr-3.5 pl-3 font-medium"
        >
          {isRequesting && <Loader2 size={ICON_SIZE} aria-hidden="true" className="animate-spin" />}
          {isRequested && <Check size={ICON_SIZE} aria-hidden="true" />}
          {isRequested ? "Link solicitado" : "Redefinir senha"}
        </Button.Root>
      </div>
      <div
        role="status"
        className="flex flex-col gap-1 rounded-b-2xl bg-desk px-6 py-3 text-sm text-ink-3"
      >
        <p>
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
