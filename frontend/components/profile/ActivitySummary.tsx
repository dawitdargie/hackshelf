"use client";

// HackShelf — activity summary (Phase 19). Counts come straight from the
// real GET /me/library + GET /me/bookmarks data (no invented metrics).

import Link from "next/link";
import type { LibrarySummary } from "@/types";
import type { Bookmark } from "@/types";

export function ActivitySummary({
  library,
  bookmarks,
}: {
  library?: LibrarySummary;
  bookmarks?: Bookmark[];
}) {
  const stats = [
    { label: "Saved books", value: library?.saved_books.length ?? 0, href: "/library" },
    {
      label: "In progress",
      value: library?.currently_reading.length ?? 0,
      href: "/library",
    },
    { label: "Bookmarks", value: bookmarks?.length ?? 0, href: "/library" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="paper-card px-4 py-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="block font-display text-2xl font-bold tracking-[-0.02em] text-ink">
            {stat.value}
          </span>
          <span className="meta-line mt-1 block">{stat.label}</span>
        </Link>
      ))}
    </div>
  );
}