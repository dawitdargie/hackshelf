import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /**
   * Optional control rendered inside the field on the right edge (e.g. the
   * show/hide-password toggle). The input gains right padding so text never
   * runs underneath it.
   */
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, trailing, ...props }, ref) => {
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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border bg-paper px-3 py-2 text-sm text-ink shadow-sm placeholder:text-muted/70 transition-all focus:border-accent ${
              trailing ? "pr-11" : ""
            } ${error ? "border-rose" : "border-line"} ${className}`}
            {...props}
          />
          {trailing && (
            <span className="absolute inset-y-0 right-1.5 flex items-center">
              {trailing}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-rose">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
