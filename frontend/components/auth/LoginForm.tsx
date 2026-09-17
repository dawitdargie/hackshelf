"use client";

// HackShelf — login form (Phase 18). React Hook Form + Zod mirroring the
// backend's validation; errors mapped from the backend error codes.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { loginSchema, apiErrorToFieldErrors, type LoginValues } from "@/lib/validators";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/library";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.replace(nextPath);
    } catch (error) {
      const { fieldErrors, formError: message } = apiErrorToFieldErrors(error);
      for (const [field, message] of Object.entries(fieldErrors)) {
        setError(field as keyof LoginValues, { message });
      }
      if (message) setFormError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && (
        <p role="alert" className="rounded-lg border border-rose/30 bg-rose-soft px-4 py-3 text-sm font-medium text-rose">
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
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        aria-invalid={Boolean(errors.password)}
        {...register("password")}
      />

      {/* Placeholder per spec — forgot-password UI is a later milestone */}
      <div className="text-right">
        <span className="cursor-not-allowed text-xs text-muted" title="Coming soon">
          Forgot password?
        </span>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {isSubmitting ? "Signing in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-ink-3">
        New here?{" "}
        <Link
          href={`/signup${nextPath !== "/library" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
          className="font-semibold text-accent-dark underline-offset-2 hover:underline"
        >
          Create a free account
        </Link>
      </p>
    </form>
  );
}