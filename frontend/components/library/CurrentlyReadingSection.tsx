"use client";

// HackShelf — currently reading section (Phase 19). Mockup's
// "continue reading" rows: cover, title, progress bar, continue link.

import Link from "next/link";
import { BookCover } from "@/components/ui/BookCover";
import { useCoverCategoryMap } from "@/hooks/useCoverCategories";
import type { ReadingItem } from "@/types";

export function CurrentlyReadingSection({ items }: { items: ReadingItem[] }) {
  const coverCategories = useCoverCategoryMap();

  if (items.length === 0) {
    return (
      <div className="paper-card px-6 py-14 text-center">
        <p className="text-sm font-medium text-ink-3">Not reading anything yet</p>
        <p className="meta-line mt-1">Open a book and your progress appears here</p>
        <Link
          href="/books"
          className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          Find a boo
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const pct = Math.min(100, Math.max(0, Math.round(item.percentage)));
        return (
          <li key={item.book.id} className="paper-card flex items-center gap-4 p-4">
            <div className="h-[72px] w-[54px] shrink-0 overflow-hidden rounded-md border border-line">
              <BookCover
                slug={item.book.slug}
                title={item.book.title}
                levelName={item.book.level.name}
                category={coverCategories[item.book.id] ?? item.book.category ?? null}
                compact
              />
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/books/${item.book.slug}`}
                className="line-clamp-1 font-display text-sm font-bold text-ink transition-colors hover:text-accent-dark"
              >
                {item.book.title}
              </Link>
              <div
                className="mt-2 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-warm"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Reading progress for ${item.book.title}`}
              >
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <p className="meta-line mt-1.5">
                <strong>{pct}%</strong> read
              </p>
            </div>

            <Link
              href={`/read/${item.book.slug}`}
              className="shrink-0 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-lime transition-colors hover:bg-ink-2"
            >
              Continue
            </Link>
          </li>
        );
      })}
    </ul>
  );
}