import { cva, cx } from "class-variance-authority";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, Ref } from "react";

type InputStateType = "default" | "invalid";

interface InputRootProps extends HTMLAttributes<HTMLDivElement> {
  state?: InputStateType;
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

type InputIconProps = HTMLAttributes<HTMLSpanElement>;
type InputActionProps = ButtonHTMLAttributes<HTMLButtonElement>;
type InputErrorProps = HTMLAttributes<HTMLParagraphElement>;

const inputVariants = cva(
  "group flex h-11 items-center gap-2.5 rounded-md border bg-paper px-3.5 transition focus-within:border-primary",
  {
    variants: {
      state: {
        default: "border-rule",
        invalid: "border-danger",
      },
    },
    defaultVariants: { state: "default" },
  },
);

function Root({ className, state, ...props }: InputRootProps) {
  return (
    <div data-slot="input-root" className={cx(inputVariants({ state }), className)} {...props} />
  );
}

function Field({ className, ...props }: InputFieldProps) {
  return (
    <input
      data-slot="input-field"
      className={cx(
        "min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-subtle",
        className,
      )}
      {...props}
    />
  );
}

function Icon({ className, ...props }: InputIconProps) {
  return (
    <span
      data-slot="input-icon"
      className={cx("flex items-center text-ink-3 group-focus-within:text-primary", className)}
      {...props}
    />
  );
}

function Action({ className, type = "button", ...props }: InputActionProps) {
  return (
    <button
      data-slot="input-action"
      type={type}
      className={cx("flex items-center rounded-sm p-1 text-ink-3 hover:text-ink", className)}
      {...props}
    />
  );
}

function ErrorMessage({ className, ...props }: InputErrorProps) {
  return (
    <p data-slot="input-error" className={cx("text-xs text-danger-text", className)} {...props} />
  );
}

export const Input = { Root, Field, Icon, Action, Error: ErrorMessage };
