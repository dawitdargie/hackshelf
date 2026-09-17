"use client";

// HackShelf — library page body (Phase 19). Protected: redirects
// unauthenticated visitors to /login?next=/library; hooks are disabled
// until authenticated (Phase 13 wiring).

import { useMemo, useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { useBookmarks, useLibrary } from "@/hooks/useLibrary";
import { LibraryTabs, type LibraryTab } from "@/components/library/LibraryTabs";
import { SavedBooksSection } from "@/components/library/SavedBooksSection";
import { CurrentlyReadingSection } from "@/components/library/CurrentlyReadingSection";
import { BookmarksSection } from "@/components/library/BookmarksSection";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function LibraryClient() {
  useRequireAuth("/library");
  const library = useLibrary();
  const bookmarks = useBookmarks();
  const [tab, setTab] = useState<LibraryTab>("saved");

  const counts = useMemo(
    () => ({
      saved: library.data?.saved_books.length ?? 0,
      reading: library.data?.currently_reading.length ?? 0,
      bookmarks: bookmarks.data?.length ?? 0,
    }),
    [library.data, bookmarks.data],
  );

  if (library.isLoading || bookmarks.isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <LoadingState rows={3} />
      </div>
    );
  }

  if (library.isError) {
    return (
      <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <ErrorState message="Couldn't load your library" onRetry={() => library.refetch()} />
      </div>
    );
  }

  if (bookmarks.isError) {
    return (
      <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <ErrorState message="Couldn't load your bookmarks" onRetry={() => bookmarks.refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      {/* Page head */}
      <div className="mb-6">
        <p className="section-label mb-2">Your account</p>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink md:text-3xl">
          My library
        </h1>
      </div>

      <LibraryTabs active={tab} counts={counts} onChange={setTab} />

      <div className="pt-6" role="tabpanel">
        {tab === "saved" && <SavedBooksSection books={library.data?.saved_books ?? []} />}
        {tab === "reading" && (
          <CurrentlyReadingSection items={library.data?.currently_reading ?? []} />
        )}
        {tab === "bookmarks" && <BookmarksSection bookmarks={bookmarks.data ?? []} />}
      </div>
    </div>
  );
}