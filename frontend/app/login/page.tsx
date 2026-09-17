import type { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "./LoginClient";
import { LoadingState } from "@/components/ui/LoadingState";

// HackShelf — login page (Phase 18). Server shell with metadata; the
// interactive form renders client-side inside Suspense.

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to HackShelf to save books, track progress, and bookmark.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-sm px-5 py-20">
          <LoadingState rows={1} />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}