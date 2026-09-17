"use client";

// HackShelf — login page body (Phase 18). Client component so `?next=` and
// the authenticated-visitor redirect work; wrapped in Suspense by the page.

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginClient() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to save books, track progress, and bookmark."
    >
      <LoginForm />
    </AuthShell>
  );
}