"use client";

// HackShelf — "Your shelf" quick-access panel on the home page (Phase 21).
// Shows the authenticated user's most recently saved books (newest save first —
// the backend already orders by created_at DESC). Hidden entirely when the user
// has no saved books, so the section never renders an empty state on the home.

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { BookCover } from "@/components/ui/BookCover";
import { useCoverCategoryMap } from "@/hooks/useCoverCategories";
import { useLibrary } from "@/hooks/useLibrary";
import { useAuth } from "@/lib/auth";

function BookShelfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 4h12v1.5H2V4zM2 8h12v1.5H2V8zM2 12h7v1.5H2V12zM11 12h3v1.5h-3V12z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function YourShelfSection() {
  const { status } = useAuth();
  const { data: library, isLoading } = useLibrary();
  const coverCategories = useCoverCategoryMap();

  if (status !== "authenticated" || isLoading || !library) return null;
  const saved = library.saved_books;
  if (!saved || saved.length === 0) return null;

  // Show the 4 most recently saved books.
  const recent = saved.slice(0, 4);

  return (
    <section className="border-t border-line py-10 md:py-14">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="flex items-center gap-2 mb-6">
          <BookShelfIcon />
          <span className="section-label">Your shelf</span>
          <span className="meta-line ml-auto">{saved.length} saved</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((book) => {
            return (
              <Link
                key={book.id}
                href={`/books/${book.slug}`}
                className="group paper-card overflow-hidden"
              >
                {/* Cover */}
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-warm">
                  <BookCover
                    slug={book.slug}
                    title={book.title}
                    levelName={book.level.name}
                    category={coverCategories[book.id] ?? book.category ?? null}
                  />
                </div>

                {/* Info */}
                <div className="p-3">
                  <Badge tone="accent" className="mb-2">
                    {book.level.name}
                  </Badge>
                  <h3 className="font-display text-sm font-bold leading-snug tracking-[-0.02em] text-ink transition-colors group-hover:text-accent-dark">
                    {book.title}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="meta-line">{book.rating.count} reviews</span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-accent-soft text-accent-dark transition-colors hover:bg-accent hover:text-white">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path
                          d="M3.5 2h9l1.5 1.5L12.5 2H3.5zM5 6.5h6M5 9.5h6M5 12.5h3"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
