"use client";

// HackShelf — bookmarks panel (Phase 20). Authenticated users only:
// bookmark the current chapter location, optional note, jump, delete.

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useBookBookmarks,
  useCreateBookmark,
  useDeleteBookmark,
} from "@/hooks/useLibrary";
import type { Bookmark } from "@/types";

function BookmarksList({
  bookmarks,
  currentSlug,
  bookId,
}: {
  bookmarks: Bookmark[];
  currentSlug: string | null;
  bookId: string;
}) {
  const remove = useDeleteBookmark(bookId);
  if (bookmarks.length === 0) {
    return <p className="meta-line">No bookmarks in this book yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id} className="rounded-lg border border-line px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="meta-line truncate">
              <strong>{bookmark.location}</strong>
            </span>
            <div className="flex shrink-0 items-center gap-3">
              {bookmark.location === currentSlug ? (
                <span className="text-xs text-accent-dark">current</span>
              ) : null}
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(bookmark.id)}
                aria-label={`Delete bookmark at ${bookmark.location}`}
                className="text-xs font-medium text-rose underline-offset-2 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
          {bookmark.note && (
            <p className="mt-1 whitespace-pre-line text-sm text-ink-3">{bookmark.note}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function BookmarksPanel({ bookId, currentSlug }: { bookId: string; currentSlug: string | null }) {
  const { status } = useAuth();
  const bookmarks = useBookBookmarks(bookId);
  const create = useCreateBookmark(bookId);
  const [note, setNote] = useState("");

  if (status !== "authenticated") {
    return (
      <p className="text-sm text-ink-3">
        <Link href={`/login?next=/read`} className="font-semibold text-accent-dark underline-offset-2 hover:underline">
          Log in
        </Link>{" "}
        to bookmark your spot in this book.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add bookmark for the current chapter location */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!currentSlug) return;
          create.mutate(
            { location: currentSlug, note },
            { onSuccess: () => setNote("") },
          );
        }}
        className="space-y-2"
      >
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          placeholder="Note (optional)"
          aria-label="Bookmark note"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink shadow-sm placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!currentSlug || create.isPending}
          className="w-full rounded-lg border border-line-2 bg-paper px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-50"
        >
          {create.isPending ? "Saving…" : "Bookmark this chapter"}
        </button>
        {/* Immediate feedback: success (after optimistic insert) or failure. */}
        {create.isSuccess && !create.isPending && (
          <p className="meta-line" role="status">
            Bookmark added ✓
          </p>
        )}
        {create.isError && (
          <p className="meta-line text-rose" role="alert">
            Couldn&apos;t add bookmark — please try again.
          </p>
        )}
      </form>

      {bookmarks.isLoading ? (
        <p className="meta-line">Loading bookmarks…</p>
      ) : (
        <BookmarksList bookmarks={bookmarks.data ?? []} currentSlug={currentSlug} bookId={bookId} />
      )}
    </div>
  );
}