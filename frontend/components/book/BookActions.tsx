"use client";

// HackShelf — book actions (Phase 16): Read button, save-to-library,
// personal rating widget. All authenticated actions disabled until login.

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useSaveBook, useUnsaveBook, useLibrary } from "@/hooks/useLibrary";
import { useUpsertRating, useDeleteRating } from "@/hooks/useReviews";

export function BookActions({ bookId, slug }: { bookId: string; slug: string }) {
  const { status } = useAuth();
  const library = useLibrary();
  const save = useSaveBook();
  const unsave = useUnsaveBook();
  const upsertRating = useUpsertRating(bookId);
  const deleteRating = useDeleteRating(bookId);

  const isSaved = (library.data?.saved_books ?? []).some((b) => b.id === bookId);
  const saving = save.isPending || unsave.isPending;
  const ratingPending = upsertRating.isPending || deleteRating.isPending;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Read — in-system reader only (no external reading links) */}
      <Link
        href={`/read/${slug}`}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-dark hover:shadow-md"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 2.5h4a2 2 0 0 1 2 2v9a1.5 1.5 0 0 0-1.5-1.5H2v-9.5ZM14 2.5h-4a2 2 0 0 0-2 2v9a1.5 1.5 0 0 1 1.5-1.5H14V2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        Read in browser
      </Link>

      {/* Save to library */}
      {status === "authenticated" ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => (isSaved ? unsave.mutate(bookId) : save.mutate(bookId))}
          className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition-all disabled:opacity-50 ${
            isSaved
              ? "border-accent bg-accent-soft text-accent-dark"
              : "border-line-2 bg-paper text-ink-3 hover:border-ink hover:text-ink"
          }`}
        >
          {isSaved ? "✓ Saved" : "Save"}
        </button>
      ) : (
        <Link
          href="/login?next=/books"
          className="inline-flex items-center rounded-lg border border-line-2 bg-paper px-5 py-3 text-sm font-semibold text-ink-3 transition-all hover:border-ink hover:text-ink"
        >
          Log in to save
        </Link>
      )}

      {/* Personal rating */}
      {status === "authenticated" ? (
        <div className="flex items-center gap-1.5" role="group" aria-label="Rate this book">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={ratingPending}
              aria-label={`Rate ${star} out of 5`}
              onClick={() => upsertRating.mutate(star)}
              className="p-0.5 text-lg leading-none transition-transform hover:scale-110 disabled:opacity-40"
            >
              <span className="text-amber">★</span>
            </button>
          ))}
          {deleteRating.isPending ? null : (
            <button
              type="button"
              onClick={() => deleteRating.mutate()}
              disabled={ratingPending}
              className="ml-2 text-xs text-muted underline underline-offset-2 transition-colors hover:text-ink disabled:opacity-40"
            >
              remove
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}