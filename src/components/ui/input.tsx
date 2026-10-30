import { cva, cx } from "class-variance-authority";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type InputStateType = "default" | "invalid";

interface InputRootProps extends HTMLAttributes<HTMLDivElement> {
  state?: InputStateType;
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

interface InputAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>;
}

interface InputSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>;
}

type InputIconProps = HTMLAttributes<HTMLSpanElement>;
type InputActionProps = ButtonHTMLAttributes<HTMLButtonElement>;
type InputErrorProps = HTMLAttributes<HTMLParagraphElement>;

const inputVariants = cva(
  "group flex h-11 items-center gap-2.5 rounded-md border bg-paper pr-2 pl-3.5 shadow-[0_1px_2px_#1b24310a] transition focus-within:border-cta focus-within:shadow-[0_0_0_0.5px_var(--color-cta)]",
  {
    variants: {
      state: {
        default: "border-ink/12",
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
        "min-w-0 flex-1 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-subtle",
        className,
      )}
      {...props}
    />
  );
}

function Area({ className, ...props }: InputAreaProps) {
  return (
    <textarea
      data-slot="input-area"
      className={cx(
        "min-h-20 w-full resize-y bg-transparent text-sm text-ink outline-none placeholder:text-subtle",
        className,
      )}
      {...props}
    />
  );
}

function Select({ className, ...props }: InputSelectProps) {
  return (
    <select
      data-slot="input-select"
      className={cx("w-full bg-transparent text-sm text-ink outline-none", className)}
      {...props}
    />
  );
}

function Icon({ className, ...props }: InputIconProps) {
  return (
    <span
      data-slot="input-icon"
      className={cx("flex items-center text-ink-3 group-focus-within:text-primary-text", className)}
      {...props}
    />
  );
}

function Action({ className, type = "button", ...props }: InputActionProps) {
  return (
    <button
      data-slot="input-action"
      type={type}
      className={cx(
        "flex size-7.5 items-center justify-center rounded-sm text-ink-3 hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}

function ErrorMessage({ className, ...props }: InputErrorProps) {
  return (
    <p data-slot="input-error" className={cx("text-xs text-danger-text", className)} {...props} />
  );
}

export const Input = { Root, Field, Area, Select, Icon, Action, Error: ErrorMessage };
