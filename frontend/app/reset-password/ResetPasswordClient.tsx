"use client";

// HackShelf — reset-password page body. The token is read from the URL
// (?token=...) and handed to the form. Keeps the form visible when signed in
// (renderFormIfAuthed) so a logged-in user can reset a different account's password.

import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password for your HackShelf account."
      renderFormIfAuthed
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}