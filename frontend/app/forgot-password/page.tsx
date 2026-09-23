import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";
import { LoadingState } from "@/components/ui/LoadingState";

// HackShelf — forgot-password page. Server shell with metadata; the
// interactive form renders client-side inside Suspense.

export const metadata: Metadata = {
  title: "Reset your password",
  description:
    "Request a HackShelf password reset link. Enter your account email and we'll send instructions.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-sm px-5 py-20">
          <LoadingState rows={1} />
        </div>
      }
    >
      <ForgotPasswordClient />
    </Suspense>
  );
}