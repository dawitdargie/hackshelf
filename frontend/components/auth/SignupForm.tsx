"use client";

// HackShelf — signup form (Phase 18). React Hook Form + Zod mirroring the
// backend's ValidateSignup rules exactly; 409 codes mapped to fields.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { signupSchema, apiErrorToFieldErrors, type SignupValues } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function SignupForm({ nextPath = "/library" }: { nextPath?: string }) {
  const { signup } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    try {
      await signup(values.username, values.email, values.password);
      router.replace(nextPath);
    } catch (error) {
      const { fieldErrors, formError: message } = apiErrorToFieldErrors(error);
      for (const [field, message] of Object.entries(fieldErrors)) {
        setError(field as keyof SignupValues, { message });
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
        label="Username"
        type="text"
        autoComplete="username"
        placeholder="neo_hacker"
        error={errors.username?.message}
        aria-invalid={Boolean(errors.username)}
        {...register("username")}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        aria-invalid={Boolean(errors.email)}
        {...register("email")}
      />
      <div>
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        <p className="meta-line mt-1.5">At least 8 characters</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {isSubmitting ? "Creating account…" : "Sign up"}
      </button>

      <p className="text-center text-sm text-ink-3">
        Already have an account?{" "}
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