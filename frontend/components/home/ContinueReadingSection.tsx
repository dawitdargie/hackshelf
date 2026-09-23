"use client";

// HackShelf — "Continue reading" panel on the home page (Phase 21).
// Fetches the authenticated user's currently-reading book and shows a compact
// progress card with a "Continue reading" button that opens the reader at the
// saved chapter (location is stored as a chapter slug — see ReaderClient).

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { BookCover } from "@/components/ui/BookCover";
import { useCoverCategoryMap } from "@/hooks/useCoverCategories";
import { useLibrary } from "@/hooks/useLibrary";
import { useAuth } from "@/lib/auth";

function ContinueIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M5.5 3.2c0-.8.9-1.3 1.6-.9l7 4.8c.6.4.6 1.4 0 1.8l-7 4.8c-.7.4-1.6-.1-1.6-.9V3.2z" />
    </svg>
  );
}

export function ContinueReadingSection() {
  const { status } = useAuth();
  const { data: library, isLoading } = useLibrary();
  const coverCategories = useCoverCategoryMap();

  // Nothing to show while auth is resolving or when logged out.
  if (status !== "authenticated" || isLoading || !library) return null;

  const item = library.currently_reading?.[0];
  if (!item) return null;

  const progress = Math.round(item.percentage);
  const slug = item.book.slug;

  return (
    <section className="border-t border-line py-10 md:py-14">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="flex items-center gap-2 mb-5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M4 2h8v3H5.5V4.5C4.5 5.4 4 6.5 4 8v5h8v-2h-1.5v1.5c0 .5-.3 1-.8 1.3-.5.3-.8.3-.8.3H4V2z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="section-label">Continue reading</span>
        </div>

        {/* Stacks on mobile so fixed-width cover and actions never squeeze
            the title out; side-by-side layout from the sm breakpoint up. */}
        <div className="paper-card group flex flex-col gap-3 p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-5 sm:p-5">
          {/* Cover + meta — clicking either opens the reader at the saved spot */}
          <Link
            href={`/read/${slug}?chapter=${item.location}`}
            className="flex min-w-0 flex-1 items-center gap-4 md:gap-5"
          >
            <div className="aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-[1.04] sm:w-[88px]">
              <BookCover
                slug={item.book.slug}
                title={item.book.title}
                levelName={item.book.level.name}
                category={coverCategories[item.book.id] ?? item.book.category ?? null}
              />
            </div>

            <div className="min-w-0">
              <Badge tone="accent" className="mb-2">
                {item.book.level.name}
              </Badge>
              <h3 className="truncate font-display text-lg font-bold leading-snug tracking-[-0.02em] text-ink transition-colors group-hover:text-accent-dark">
                {item.book.title}
              </h3>
            </div>
          </Link>

          {/* Progress + continue action — own row on mobile, right-aligned
              on larger screens */}
          <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-normal sm:pr-2">
            <span className="meta-line shrink-0">{progress}%</span>
            <div className="h-2.5 min-w-[60px] flex-1 overflow-hidden rounded-full bg-warm sm:w-[110px] sm:flex-none">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.book.title}: ${progress}% read`}
              />
            </div>
            <Link
              href={`/read/${slug}?chapter=${item.location}`}
              className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-semibold text-white transition-colors hover:bg-accent-dark"
            >
              <ContinueIcon />
              Continue
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
