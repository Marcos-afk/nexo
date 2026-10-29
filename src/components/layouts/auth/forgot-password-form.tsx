"use client";

import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOGIN_PATH } from "@/constants/routes";
import { useForgotPassword } from "@/viewmodels/use-forgot-password";

const ICON_SIZE = 18;
const BACK_LINK_CLASS =
  "flex w-fit items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink";

interface RequestedProps {
  readonly email: string;
}

function Requested({ email }: RequestedProps) {
  return (
    <div role="status" className="flex w-full max-w-100 flex-col gap-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success-text">
        <MailCheck size={22} aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-4xl leading-none tracking-tight text-ink">
          Confira seu e-mail
        </h2>
        <p className="text-sm text-ink-2">
          Enviamos um link de redefinição de senha para{" "}
          <strong className="font-semibold">{email}</strong>.
        </p>
        <p className="rounded-lg bg-card px-3.5 py-2 text-xs text-ink-3">
          Demonstração: nenhum e-mail real é enviado, e o Nexo aceita qualquer senha para entrar.
        </p>
      </div>
      <Link href={LOGIN_PATH} className={BACK_LINK_CLASS}>
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar para o login
      </Link>
    </div>
  );
}

export function ForgotPasswordForm() {
  const { form, errors, isSubmitting, requestedEmail, onSubmit } = useForgotPassword();
  const error = errors.email?.message;

  if (requestedEmail !== null) {
    return <Requested email={requestedEmail} />;
  }

  return (
    <form className="flex w-full max-w-100 flex-col gap-6" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-4xl leading-none tracking-tight text-ink">
          Esqueci minha senha
        </h2>
        <p className="text-sm text-ink-3">
          Informe seu e-mail corporativo e enviaremos um link para criar uma nova senha.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-email" className="text-sm font-medium text-ink">
          E-mail corporativo
        </label>
        <Input.Root state={error ? "invalid" : "default"}>
          <Input.Icon>
            <Mail size={ICON_SIZE} />
          </Input.Icon>
          <Input.Field
            id="forgot-email"
            type="email"
            autoComplete="username"
            placeholder="nome@nexo.com.br"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "forgot-email-error" : undefined}
            {...form.register("email")}
          />
        </Input.Root>
        {error && <Input.Error id="forgot-email-error">{error}</Input.Error>}
      </div>
      <Button.Root type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 size={ICON_SIZE} className="animate-spin" />}
        {isSubmitting ? "Enviando…" : "Enviar link"}
        {!isSubmitting && <ArrowRight size={ICON_SIZE} />}
      </Button.Root>
      <Link href={LOGIN_PATH} className={BACK_LINK_CLASS}>
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar para o login
      </Link>
    </form>
  );
}
