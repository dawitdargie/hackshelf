"use client";

// HackShelf — "forgot password" form. Sends the email address to
// POST /auth/forgot-password, which always answers generically so the form can
// never be used to discover which emails have accounts.

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ApiError } from "@/lib/api";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validators";
import { Input } from "@/components/ui/Input";

export function ForgotPasswordForm({
  nextPath = "/library",
}: {
  nextPath?: string;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    try {
      await api.rawPost<{ message: string }>("/auth/forgot-password", {
        email: values.email,
      });
      setSentTo(values.email);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Could not reach the server",
      );
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-5">
        <p
          role="status"
          className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-dark"
        >
          If an account exists for {sentTo}, instructions have been sent.
        </p>
        <p className="text-sm leading-relaxed text-ink-3">
          Check your inbox for the reset link. The link expires after one hour.
        </p>
        <p className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber/40 bg-amber-soft px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0 text-amber">
            <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M2 4l6 4.5L14 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] leading-snug text-ink">
            <strong className="font-semibold text-amber">Not in your inbox?</strong> Check
            your <strong className="font-semibold">spam or junk folder</strong>:
            reset emails very often land there, and the link still works.
          </span>
        </p>
        {process.env.NODE_ENV !== "production" && (
          <p className="meta-line">
            dev only. The reset link is printed in the API server log
            (docker compose logs backend)
          </p>
        )}
        <Link
          href={`/login${nextPath !== "/library" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
          className="block w-full rounded-lg border border-line-2 bg-paper py-3 text-center text-sm font-semibold text-ink-3 transition-colors hover:border-ink hover:text-ink"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && (
        <p
          role="alert"
          className="rounded-lg border border-rose/30 bg-rose-soft px-4 py-3 text-sm font-medium text-rose"
        >
          {formError}
        </p>
      )}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        aria-invalid={Boolean(errors.email)}
        {...register("email")}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-ink-3">
        Remembered it?{" "}
        <Link
          href={`/login${nextPath !== "/library" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
          className="font-semibold text-accent-dark underline-offset-2 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}