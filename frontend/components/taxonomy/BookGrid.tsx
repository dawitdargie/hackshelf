import Link from "next/link";
import { BookCard } from "@/components/ui/BookCard";
import type { BookSummary } from "@/types";

// HackShelf — taxonomy book grid (Phase 17). Server component: BookCard
// grid with an empty state; links back into the filtered catalog.

export function BookGrid({
  books,
  emptyLabel,
  catalogHref,
}: {
  books: BookSummary[];
  emptyLabel: string;
  catalogHref?: string;
}) {
  if (books.length === 0) {
    return (
      <div className="paper-card px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink-3">{emptyLabel}</p>
        {catalogHref && (
          <Link
            href={catalogHref}
            className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Browse the catalog
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}