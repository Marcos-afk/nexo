"use client";

import { ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import type { FieldErrors, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORGOT_PASSWORD_PATH } from "@/constants/routes";
import type { LoginFormValues } from "@/models/auth";
import { useLogin } from "@/viewmodels/use-login";

const ICON_SIZE = 16;
const CHECK_SIZE = 12;
const LABEL_CLASS = "text-[13.5px] font-medium text-ink";

interface FieldProps {
  readonly form: UseFormReturn<LoginFormValues>;
  readonly errors: FieldErrors<LoginFormValues>;
}

interface PasswordFieldProps extends FieldProps {
  readonly showPassword: boolean;
  readonly onToggleShowPassword: () => void;
}

function EmailField({ form, errors }: FieldProps) {
  const error = errors.email?.message;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="email" className={LABEL_CLASS}>
        E-mail corporativo
      </label>
      <Input.Root state={error ? "invalid" : "default"}>
        <Input.Icon>
          <Mail size={ICON_SIZE} />
        </Input.Icon>
        <Input.Field
          id="email"
          type="email"
          autoComplete="username"
          placeholder="nome@nexo.com.br"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "email-error" : undefined}
          {...form.register("email")}
        />
      </Input.Root>
      {error && <Input.Error id="email-error">{error}</Input.Error>}
    </div>
  );
}

function PasswordField({ form, errors, showPassword, onToggleShowPassword }: PasswordFieldProps) {
  const error = errors.password?.message;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="password" className={LABEL_CLASS}>
          Senha
        </label>
        <Link
          href={FORGOT_PASSWORD_PATH}
          className="text-[13.5px] font-medium text-primary-text hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>
      <Input.Root state={error ? "invalid" : "default"}>
        <Input.Icon>
          <LockKeyhole size={ICON_SIZE} />
        </Input.Icon>
        <Input.Field
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Sua senha"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "password-error" : undefined}
          {...form.register("password")}
        />
        <Input.Action
          onClick={onToggleShowPassword}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? <EyeOff size={ICON_SIZE} /> : <Eye size={ICON_SIZE} />}
        </Input.Action>
      </Input.Root>
      {error && <Input.Error id="password-error">{error}</Input.Error>}
    </div>
  );
}

function SubmitButton({ isSubmitting }: { readonly isSubmitting: boolean }) {
  return (
    <Button.Root
      type="submit"
      size="lg"
      disabled={isSubmitting}
      className="shadow-[0_1px_2px_#0062c433,0_6px_16px_#0062c426]"
    >
      {isSubmitting && <Loader2 size={ICON_SIZE} className="animate-spin" />}
      {isSubmitting ? "Entrando…" : "Entrar"}
      {!isSubmitting && <ArrowRight size={ICON_SIZE} />}
    </Button.Root>
  );
}

export function LoginForm() {
  const { form, errors, onSubmit, showPassword, toggleShowPassword, isSubmitting } = useLogin();

  return (
    <form className="flex w-full max-w-95 flex-col gap-7" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-[40px] leading-[1.1] tracking-[-0.8px] text-ink">
          Entrar
        </h2>
        <p className="text-[15.5px] leading-normal text-ink-3">
          Use seu e-mail corporativo e a senha da rede Nexo.
        </p>
      </div>

      <div className="flex flex-col gap-4.5">
        <EmailField form={form} errors={errors} />
        <PasswordField
          form={form}
          errors={errors}
          showPassword={showPassword}
          onToggleShowPassword={toggleShowPassword}
        />
        <label className="flex cursor-pointer items-center gap-2.25 pt-0.5 text-[13.5px] text-ink-2">
          <span className="relative flex size-4.5 shrink-0">
            <input
              type="checkbox"
              className="peer size-full cursor-pointer appearance-none rounded-sm border border-border-strong bg-paper checked:border-cta checked:bg-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...form.register("remember")}
            />
            <Check
              size={CHECK_SIZE}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100"
            />
          </span>
          Manter conectado neste computador
        </label>
      </div>

      <SubmitButton isSubmitting={isSubmitting} />
      <div aria-hidden="true" className="border-t border-rule pt-4" />
    </form>
  );
}
