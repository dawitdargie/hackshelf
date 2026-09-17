import type { Metadata } from "next";
import { Suspense } from "react";
import ProfileClient from "./ProfileClient";
import { LoadingState } from "@/components/ui/LoadingState";

// HackShelf — profile page (Phase 19). Server shell with metadata;
// protected content renders client-side inside Suspense.

export const metadata: Metadata = {
  title: "Profile",
  description: "Your HackShelf account and reading activity.",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-5 py-10">
          <LoadingState rows={2} />
        </div>
      }
    >
      <ProfileClient />
    </Suspense>
  );
}