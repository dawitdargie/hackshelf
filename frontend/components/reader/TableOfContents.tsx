"use client";

// HackShelf — table of contents (Phase 20). Chapter list from the backend's
// TOC endpoint; current chapter highlighted, others link via ?chapter=.

import { useState } from "react";
import type { ChapterMeta } from "@/types";

export function TableOfContents({
  chapters,
  currentSlug,
  basePath,
}: {
  chapters: ChapterMeta[];
  currentSlug: string | null;
  basePath: string;
}) {
  const [query, setQuery] = useState("");
  const visible = query.trim()
    ? chapters.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
    : chapters;

  return (
    <nav aria-label="Table of contents">
      {/* Search within book: filters chapter titles client-side (chapters are
          already loaded — no extra requests). */}
      <div className="mb-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapters…"
          aria-label="Search chapters"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink shadow-sm placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none"
        />
      </div>
      <ol className="space-y-0.5">
        {visible.map((chapter) => {
          const active = chapter.slug === currentSlug;
          return (
            <li key={chapter.id}>
              <a
                href={`${basePath}?chapter=${chapter.slug}`}
                aria-current={active ? "true" : undefined}
                className={`flex items-baseline gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-accent-soft font-semibold text-accent-dark"
                    : "text-ink-3 hover:bg-warm hover:text-ink"
                }`}
              >
                <span className="meta-line shrink-0">{chapter.chapter_order}.</span>
                <span className="line-clamp-2">{chapter.title}</span>
              </a>
            </li>
          );
        })}
        {visible.length === 0 && <li className="meta-line px-2.5 py-2">No matching chapters</li>}
      </ol>
    </nav>
  );
}