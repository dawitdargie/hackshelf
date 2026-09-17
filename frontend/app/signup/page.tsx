import type { Metadata } from "next";
import { Suspense } from "react";
import SignupClient from "./SignupClient";
import { LoadingState } from "@/components/ui/LoadingState";

// HackShelf — signup page (Phase 18). Server shell with metadata; the
// interactive form renders client-side inside Suspense.

export const metadata: Metadata = {
  title: "Sign up free",
  description:
    "Create a free HackShelf account to save books, track progress, and bookmark.",
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-sm px-5 py-20">
          <LoadingState rows={1} />
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  );
}