import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";
import { LoadingState } from "@/components/ui/LoadingState";

// HackShelf — reset-password page. Reads the single-use token from the link
// emailed by /forgot-password; wrapped in Suspense because it uses
// useSearchParams.

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your HackShelf account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-sm px-5 py-20">
          <LoadingState rows={1} />
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}