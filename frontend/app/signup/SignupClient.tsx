// HackShelf — signup page body (Phase 18). Client component; wrapped in
// Suspense by the page.

import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupClient() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever. Save books, track reading progress, and more."
    >
      <SignupForm />
    </AuthShell>
  );
}