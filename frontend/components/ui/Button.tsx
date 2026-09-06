import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "terminal" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-base font-semibold hover:bg-primary-dim hover:shadow-glow-sm",
  ghost:
    "border border-line text-muted hover:border-primary/40 hover:text-primary",
  terminal:
    "border border-primary/40 bg-primary/10 font-mono text-primary hover:bg-primary/20 hover:shadow-glow-sm",
  danger:
    "border border-danger/40 bg-danger/10 font-mono text-danger hover:bg-danger/20",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
