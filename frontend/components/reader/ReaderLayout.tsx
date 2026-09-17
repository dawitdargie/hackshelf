"use client";

// HackShelf — reader layout (Phase 20). TOC sidebar (sticky desktop,
// collapsible mobile) + content area; also the fullscreen target.

import Link from "next/link";
import { TableOfContents } from "./TableOfContents";
import type { ChapterMeta } from "@/types";

export function ReaderLayout({
  bookTitle,
  chapters,
  currentSlug,
  basePath,
  controls,
  progress,
  bookmarks,
  containerRef,
  children,
}: {
  bookTitle: string;
  chapters: ChapterMeta[];
  currentSlug: string | null;
  basePath: string;
  controls: React.ReactNode;
  progress: React.ReactNode;
  bookmarks: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div ref={containerRef} className="bg-bg pb-2">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 md:grid-cols-[260px_1fr] md:px-10">
        {/* Sidebar */}
        <aside className="md:sticky md:top-[84px] md:self-start">
          <div className="paper-card p-4">
            <Link
              href="/books"
              className="mb-3 block font-display text-base font-bold tracking-[-0.02em] text-ink transition-colors hover:text-accent-dark"
            >
              {bookTitle}
            </Link>
            <div className="mb-3 border-b border-line pb-3">{controls}</div>
            <TableOfContents chapters={chapters} currentSlug={currentSlug} basePath={basePath} />
          </div>
          <div className="paper-card mt-4 hidden p-4 md:block">{progress}</div>
          <div className="paper-card mt-4 hidden p-4 md:block">{bookmarks}</div>
        </aside>

        {/* Content */}
        <div>
          <div className="mb-4 md:hidden">{controls}</div>
          <div className="paper-card px-5 py-8 md:px-10 md:py-10">{children}</div>
          <div className="paper-card mt-4 p-4 md:hidden">{progress}</div>
          <div className="paper-card mt-4 p-4 md:hidden">{bookmarks}</div>
        </div>
      </div>
    </div>
  );
}