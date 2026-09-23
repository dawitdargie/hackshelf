"use client";

// HackShelf — password field with a show/hide control.
// Wraps <Input> so React Hook Form's register() ref still lands on the real
// <input> element. Two controls share one piece of state so they never drift:
//   * the "Show password" checkbox beneath the field, and
//   * an in-field eye / eye-off toggle button.

import { forwardRef, useState } from "react";
import { Input, type InputProps } from "@/components/ui/Input";

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  /** Render the "Show password" checkbox beneath the field. */
  showCheckbox?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showCheckbox = true, id, name, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? name ?? "password";

    return (
      <div className="w-full">
        <Input
          {...props}
          ref={ref}
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          trailing={
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              aria-controls={inputId}
              title={visible ? "Hide password" : "Show password"}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:text-ink"
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />
        {showCheckbox && (
          <label className="mt-2 flex w-fit cursor-pointer select-none items-center gap-2 font-mono text-xs text-ink-3">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer rounded border-line-2 accent-accent"
            />
            Show password
          </label>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3.2 4.1" />
      <path d="M6.3 7.4A16.9 16.9 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.9-.4 4.1-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
