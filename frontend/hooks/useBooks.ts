"use client";

// HackShelf — books query hooks (Phase 13).

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetchBookList } from "@/lib/queries";
import type { BookListFilters, Book, Chapter, ChapterMeta } from "@/types";

/** GET /books — paginated, filterable, sortable book list. */
export function useBooks(filters: BookListFilters = {}) {
  return useQuery({
    queryKey: ["books", filters],
    queryFn: () => fetchBookList(filters),
    placeholderData: keepPreviousData,
  });
}

/** GET /books/:slug — full book details. */
export function useBook(slug: string | undefined) {
  return useQuery({
    queryKey: ["book", slug],
    queryFn: () => api.get<Book>(`/books/${slug}`),
    enabled: Boolean(slug),
  });
}

/** GET /books/:slug/chapters — chapter list (TOC). */
export function useChapters(slug: string | undefined) {
  return useQuery({
    queryKey: ["chapters", slug],
    queryFn: () => api.get<ChapterMeta[]>(`/books/${slug}/chapters`),
    enabled: Boolean(slug),
  });
}

/** GET /books/:slug/chapters/:chapterSlug — one hosted chapter. */
export function useChapter(slug: string | undefined, chapterSlug: string | undefined) {
  return useQuery({
    queryKey: ["chapter", slug, chapterSlug],
    queryFn: () => api.get<Chapter>(`/books/${slug}/chapters/${chapterSlug}`),
    enabled: Boolean(slug && chapterSlug),
  });
}