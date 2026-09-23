"use client";

// HackShelf — login page body (Phase 18). Client component so `?next=` and
// the authenticated-visitor notice work; wrapped in Suspense by the page.

import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { sanitizeNextPath } from "@/lib/validators";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to save books, track progress, and bookmark."
    >
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}