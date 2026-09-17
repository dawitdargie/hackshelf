"use client";

// HackShelf — bookmarks section (Phase 19). Rows with book, location, note,
// and delete (backend supports DELETE /me/bookmarks/:id).

import Link from "next/link";
import { useDeleteBookmark } from "@/hooks/useLibrary";
import type { Bookmark } from "@/types";

export function BookmarksSection({ bookmarks }: { bookmarks: Bookmark[] }) {
  const remove = useDeleteBookmark();

  if (bookmarks.length === 0) {
    return (
      <div className="paper-card px-6 py-14 text-center">
        <p className="text-sm font-medium text-ink-3">No bookmarks yet</p>
        <p className="meta-line mt-1">Bookmark a spot while reading to find it fast</p>
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
    <ul className="space-y-3">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id} className="paper-card flex items-start gap-4 p-4">
          <div className="min-w-0 flex-1">
            {bookmark.book_slug && (
              <Link
                href={`/books/${bookmark.book_slug}`}
                className="font-display text-sm font-bold text-ink transition-colors hover:text-accent-dark"
              >
                {bookmark.book_title ?? "Untitled book"}
              </Link>
            )}
            <p className="meta-line mt-1">
              Location: <strong>{bookmark.location}</strong>
            </p>
            {bookmark.note && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-3">
                {bookmark.note}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => remove.mutate(bookmark.id)}
            aria-label={`Delete bookmark in ${bookmark.book_title ?? "book"}`}
            className="shrink-0 text-xs font-medium text-rose underline-offset-2 transition-colors hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}