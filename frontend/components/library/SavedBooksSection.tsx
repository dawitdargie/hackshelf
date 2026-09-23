"use client";

// HackShelf — saved books section (Phase 19). BookCard grid of the user's
// saved books, each linking to the book details page.

import Link from "next/link";
import { BookCard } from "@/components/ui/BookCard";
import { useCoverCategoryMap } from "@/hooks/useCoverCategories";
import type { BookSummary } from "@/types";

export function SavedBooksSection({ books }: { books: BookSummary[] }) {
  const coverCategories = useCoverCategoryMap();

  if (books.length === 0) {
    return (
      <div className="paper-card px-6 py-14 text-center">
        <p className="text-sm font-medium text-ink-3">Nothing saved yet</p>
        <p className="meta-line mt-1">Tap Save on any book to keep it here</p>
        <Link
          href="/books"
          className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          Browse the catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} coverCategory={coverCategories[book.id] ?? null} />
      ))}
    </div>
  );
}