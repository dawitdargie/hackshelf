"use client";

// HackShelf — signup page body (Phase 18). Client component so `?next=` and
// the authenticated-visitor notice work; wrapped in Suspense by the page.

import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { sanitizeNextPath } from "@/lib/validators";

export default function SignupClient() {
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever. Save books, track reading progress, and more."
    >
      <SignupForm nextPath={nextPath} />
    </AuthShell>
  );
}