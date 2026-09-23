"use client";

// HackShelf — "reset password" form. The token comes from the emailed link
// (/reset-password?token=...) and is exchanged for a new password via
// POST /auth/reset-password. Success revokes every existing session, so the
// user is asked to log in again.

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ApiError } from "@/lib/api";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validators";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(values: ResetPasswordValues) {
    if (!token) return;
    setFormError(null);
    try {
      await api.rawPost<void>("/auth/reset-password", {
        token,
        password: values.password,
      });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "VALIDATION_ERROR") {
          setError("password", { message: error.message });
          return;
        }
        setFormError(error.message);
        return;
      }
      setFormError("Could not reach the server");
    }
  }

  // No token in the URL at all — explain how to get a fresh link.
  if (!token) {
    return (
      <div className="space-y-5">
        <p
          role="alert"
          className="rounded-lg border border-rose/30 bg-rose-soft px-4 py-3 text-sm font-medium text-rose"
        >
          This reset link is missing its token.
        </p>
        <p className="text-sm leading-relaxed text-ink-3">
          Open the link from your reset email, or request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="block w-full rounded-lg bg-accent py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5">
        <p
          role="status"
          className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-dark"
        >
          Password updated. You can now log in with your new password.
        </p>
        <p className="text-sm leading-relaxed text-ink-3">
          For safety, every device that was signed in has been signed out.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-lg bg-accent py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
        >
          Log in
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

      <div>
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        <p className="meta-line mt-1.5">At least 8 characters</p>
      </div>

      <PasswordInput
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        aria-invalid={Boolean(errors.confirmPassword)}
        {...register("confirmPassword")}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {isSubmitting ? "Updating…" : "Set new password"}
      </button>

      <p className="text-center text-sm text-ink-3">
        <Link
          href="/login"
          className="font-semibold text-accent-dark underline-offset-2 hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </form>
  );
}