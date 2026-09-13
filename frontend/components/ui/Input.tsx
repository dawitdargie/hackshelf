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
          <label
            htmlFor={inputId}
            className="mb-1.5 block font-mono text-xs font-medium text-ink-3"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border bg-paper px-3 py-2 text-sm text-ink shadow-sm placeholder:text-muted/70 transition-all focus:border-accent ${
            error ? "border-rose" : "border-line"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-rose">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
