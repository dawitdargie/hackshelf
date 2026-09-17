import type { Metadata } from "next";
import { Suspense } from "react";
import LibraryClient from "./LibraryClient";
import { LoadingState } from "@/components/ui/LoadingState";

// HackShelf — library page (Phase 19). Server shell with metadata;
// protected content renders client-side inside Suspense.

export const metadata: Metadata = {
  title: "My Library",
  description: "Your saved books, reading progress, and bookmarks on HackShelf.",
  robots: { index: false },
};

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
          <LoadingState rows={3} />
        </div>
      }
    >
      <LibraryClient />
    </Suspense>
  );
}