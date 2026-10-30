import { cva, cx } from "class-variance-authority";
import type { ButtonHTMLAttributes, Ref } from "react";

type ButtonSizeType = "md" | "lg";
type ButtonVariantType = "primary" | "ghost" | "outline" | "danger";

interface ButtonRootProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSizeType;
  variant?: ButtonVariantType;
  ref?: Ref<HTMLButtonElement>;
}

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-md whitespace-nowrap transition",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  ],
  {
    variants: {
      size: {
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-[15.5px]",
      },
      variant: {
        primary: "bg-cta font-semibold text-white hover:bg-primary-text",
        ghost: "bg-transparent font-medium text-ink-2 hover:bg-card",
        outline:
          "border border-ink/12 bg-paper font-medium text-ink shadow-[0_1px_2px_#1b24310d] hover:bg-card",
        danger: "bg-danger-soft font-semibold text-danger-text hover:bg-danger/20",
      },
    },
    defaultVariants: { size: "md", variant: "primary" },
  },
);

function Root({ className, size, variant, type = "button", ...props }: ButtonRootProps) {
  return (
    <button
      data-slot="button-root"
      type={type}
      className={cx(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export const Button = { Root };
