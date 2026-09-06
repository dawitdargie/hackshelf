import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="meta-line mb-1.5 block">
            <span className="text-primary">&gt;</span> {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded border bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted/50 transition-all focus:border-primary/60 focus:shadow-glow-sm ${
            error ? "border-danger/60" : "border-line"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 font-mono text-xs text-danger">[!] {error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
