"use client";

// HackShelf — catalog results grid (Phase 15).
// Renders BookCards from GET /books with the backend's meta block.

import { BookCard } from "@/components/ui/BookCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { useCoverCategoryMap } from "@/hooks/useCoverCategories";
import type { BookSummary, Paginated } from "@/types";

export function ResultsGrid({
  result,
  isLoading,
  isError,
  refetch,
  page,
  onClearFilters,
}: {
  result?: Paginated<BookSummary>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  page: number;
  onClearFilters: () => void;
}) {
  // Cover category: the least-populated category of each book (see
  // lib/coverCategory). Empty while loading; cards fall back to the primary.
  const coverCategories = useCoverCategoryMap();

  if (isLoading && !result) {
    return (
      <div>
        <LoadingState rows={8} />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Couldn't load the catalog" onRetry={refetch} />;
  }

  const books = result?.data ?? [];
  const meta = result?.meta;

  if (books.length === 0) {
    return (
      <div className="paper-card px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink-3">No books match your search</p>
        <p className="meta-line mt-1">Try different keywords or clear the filters</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} coverCategory={coverCategories[book.id] ?? null} />
        ))}
      </div>
      {meta && (
        <div className="mt-10">
          <Pagination
            page={page}
            totalPages={meta.total_pages}
            baseHref={
              typeof window !== "undefined"
                ? `${window.location.pathname}${window.location.search}`
                : "/books"
            }
          />
        </div>
      )}
    </>
  );
}