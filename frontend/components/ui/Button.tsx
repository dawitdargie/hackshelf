import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "lime" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white font-semibold hover:bg-accent-dark shadow-sm hover:shadow-md",
  ghost:
    "border border-line-2 bg-paper text-ink-3 font-medium hover:border-ink hover:text-ink",
  lime: "bg-ink text-lime font-semibold hover:bg-ink-2 shadow-sm hover:shadow-md",
  danger:
    "border border-rose/30 bg-rose-soft text-rose font-medium hover:bg-rose/10",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
