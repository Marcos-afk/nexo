import { cva, cx } from "class-variance-authority";
import type { ButtonHTMLAttributes, Ref } from "react";

type ButtonSizeType = "md" | "lg";
type ButtonVariantType = "primary" | "ghost";

interface ButtonRootProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSizeType;
  variant?: ButtonVariantType;
  ref?: Ref<HTMLButtonElement>;
}

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  ],
  {
    variants: {
      size: {
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm",
      },
      variant: {
        primary: "bg-cta text-white hover:bg-primary-text",
        ghost: "bg-transparent text-ink-2 hover:bg-card",
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
