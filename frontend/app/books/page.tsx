import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogClient } from "./CatalogClient";
import { LoadingState } from "@/components/ui/LoadingState";

// HackShelf — books catalog page (Phase 15). Server shell with SEO metadata;
// the interactive, URL-driven catalog renders client-side inside Suspense.

export const metadata: Metadata = {
  title: "Browse Books",
  description:
    "Search and filter the HackShelf catalog — free, legally hosted hacking and cybersecurity books by level, category, topic, and rating.",
  openGraph: {
    title: "Browse Books · HackShelf",
    description:
      "Search and filter free, legally hosted hacking and cybersecurity books.",
    type: "website",
  },
};

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
          <LoadingState rows={4} />
        </div>
      }
    >
      <CatalogClient />
    </Suspense>
  );
}