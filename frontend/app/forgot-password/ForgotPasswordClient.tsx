"use client";

// HackShelf — forgot-password page body. Keeps the form visible even when
// signed in (renderFormIfAuthed) so a logged-in user can still recover a
// different account's password.

import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { sanitizeNextPath } from "@/lib/validators";

export default function ForgotPasswordClient() {
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email and we'll send a reset link."
      renderFormIfAuthed
    >
      <ForgotPasswordForm nextPath={nextPath} />
    </AuthShell>
  );
}