"use client";

// HackShelf — reader client (Phase 20).
// Chapter-by-chapter loading (never the whole book), URL-driven chapter
// selection, keyboard nav, prefs, bookmarks + progress for authenticated users.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useBook, useChapter, useChapters } from "@/hooks/useBooks";
import { useProgress, useSaveProgress } from "@/hooks/useLibrary";
import { useAuth } from "@/lib/auth";
import { ReaderLayout } from "@/components/reader/ReaderLayout";
import { ReaderControls, useReaderPreferences } from "@/components/reader/ReaderControls";
import { ReaderSearch } from "@/components/reader/ReaderSearch";
import { ChapterContent } from "@/components/reader/ChapterContent";
import { BookmarksPanel } from "@/components/reader/BookmarksPanel";
import { ProgressBar } from "@/components/reader/ProgressBar";
import { computePercent } from "@/lib/reader";
import { ApiError } from "@/lib/api";

export default function ReaderClient({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const prefs = useReaderPreferences();

  const book = useBook(slug);
  const chapters = useChapters(slug);
  const chapterList = useMemo(() => chapters.data ?? [], [chapters.data]);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // --- Progress (GET /progress 404s with PROGRESS_NOT_FOUND when the reader
  // never opened the book — that means "no progress", not an error) ---
  const progress = useProgress(book.data?.id);
  const savedProgress =
    progress.isError && progress.error instanceof ApiError && progress.error.isNotFound
      ? null
      : progress.data ?? null;

  // Chapter selection: an explicit ?chapter= wins, then the saved position,
  // then the first chapter. Deriving it — rather than redirecting to it — means
  // the reader never briefly renders (and saves progress for) the wrong chapter.
  const chapterFromUrl = searchParams.get("chapter");
  const urlChapter =
    chapterFromUrl && chapterList.some((c) => c.slug === chapterFromUrl) ? chapterFromUrl : null;
  const savedChapter =
    savedProgress && chapterList.some((c) => c.slug === savedProgress.location)
      ? savedProgress.location
      : null;
  const currentSlug = urlChapter ?? savedChapter ?? chapterList[0]?.slug ?? null;
  const currentIndex = chapterList.findIndex((c) => c.slug === currentSlug);
  const chapter = useChapter(slug, currentSlug ?? undefined);
  const saveProgress = useSaveProgress(book.data?.id ?? "");

  // Keep the URL in sync with the restored chapter so links stay shareable.
  useEffect(() => {
    if (!currentSlug || urlChapter) return;
    router.replace(`/read/${slug}?chapter=${currentSlug}`, { scroll: false });
  }, [currentSlug, urlChapter, router, slug]);

  // Until the saved position is known, the chapter shown is only a guess — so
  // don't record it, or opening a book would clobber the reader's saved place.
  const awaitingRestore =
    status === "authenticated" && Boolean(book.data) && !chapterFromUrl && progress.isLoading;

  // Save progress on every chapter change (authenticated readers).
  useEffect(() => {
    if (awaitingRestore || status !== "authenticated" || !book.data || currentIndex < 0) return;
    saveProgress.mutate({
      location: chapterList[currentIndex].slug,
      percentage: computePercent(currentIndex, chapterList.length),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingRestore, currentIndex, book.data?.id, status]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= chapterList.length) return;
      router.replace(`/read/${slug}?chapter=${chapterList[index].slug}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [chapterList, router, slug],
  );

  // Keyboard navigation: ← / →
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key === "ArrowRight") goTo(currentIndex + 1);
      if (e.key === "ArrowLeft") goTo(currentIndex - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, currentIndex]);

  if (chapters.isLoading || book.isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <div className="paper-card h-96 animate-pulse" />
      </div>
    );
  }

  if (book.isError || chapters.isError || chapterList.length === 0) {
    const noContent = chapterList.length === 0 && !book.isError && !chapters.isError;
    return (
      <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10">
        <div className="paper-card px-6 py-14 text-center">
          <p className="text-sm font-medium text-ink-3">Reader unavailable</p>
          <p className="meta-line mt-1">
            {noContent
              ? "This book has no hosted chapters yet."
              : "This book's hosted content failed to load."}
          </p>
          <Link
            href={`/books/${slug}`}
            className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Back to book page
          </Link>
        </div>
      </div>
    );
  }

  const percent = computePercent(currentIndex, chapterList.length);
  const prev = currentIndex > 0 ? chapterList[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < chapterList.length - 1
      ? chapterList[currentIndex + 1]
      : null;
  const chapterData = chapter.data;

  return (
    <ReaderLayout
      bookTitle={book.data?.title ?? "Reader"}
      chapters={chapterList}
      currentSlug={currentSlug}
      basePath={`/read/${slug}`}
      containerRef={containerRef}
      controls={
        <ReaderControls
          fontStep={prefs.fontStep}
          mode={prefs.mode}
          onFontChange={prefs.changeFont}
          onToggleMode={prefs.toggleMode}
          containerRef={containerRef}
        />
      }
      progress={<ProgressBar percent={percent} />}
      bookmarks={book.data ? <BookmarksPanel bookId={book.data.id} currentSlug={currentSlug} /> : null}
    >
      {chapterData && (
        <div className="mb-6">
          <p className="section-label mb-1">
            Chapter {chapterData.chapter_order} of {chapterList.length}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink md:text-3xl">
            {chapterData.title}
          </h1>
          <div className="mt-4">
            <ReaderSearch contentRef={contentRef} />
          </div>
        </div>
      )}

      <div ref={contentRef} className={prefs.mode === "dark" ? "rounded-lg bg-ink p-6" : undefined}>
        <ChapterContent chapter={chapterData} fontClass={prefs.fontClass} mode={prefs.mode} />
      </div>

      {/* Prev / next navigation */}
      <nav aria-label="Chapter navigation" className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
        {prev ? (
          <button
            type="button"
            onClick={() => goTo(currentIndex - 1)}
            className="paper-card max-w-[45%] truncate px-4 py-2.5 text-sm font-medium text-ink-3 transition-colors hover:border-ink hover:text-ink"
          >
            ← {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button
            type="button"
            onClick={() => goTo(currentIndex + 1)}
            className="paper-card max-w-[45%] truncate px-4 py-2.5 text-right text-sm font-medium text-ink-3 transition-colors hover:border-ink hover:text-ink"
          >
            {next.title} →
          </button>
        ) : (
          <span className="meta-line">End of book</span>
        )}
      </nav>

      {/* Attribution — informational only, never a reading path */}
      {book.data && (
        <footer className="meta-line mt-8 border-t border-line pt-4">
          {book.data.license && (
            <p>
              License: <strong>{book.data.license}</strong>
            </p>
          )}
          {book.data.source_url && (
            <p className="break-all">
              Source:{" "}
              <a
                href={book.data.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-ink"
              >
                {book.data.source_url}
              </a>
            </p>
          )}
        </footer>
      )}
    </ReaderLayout>
  );
}