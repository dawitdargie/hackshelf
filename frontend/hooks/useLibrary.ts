"use client";

// HackShelf — library hooks (Phase 13): saved books, bookmarks, reading progress.
// All endpoints are authenticated; queries stay disabled while logged out.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import type {
  Bookmark,
  BookmarkCreateInput,
  LibrarySummary,
  ProgressUpsertInput,
  ReadingProgress,
} from "@/types";

// --- Saved books (library) ---

export function useLibrary() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["library"],
    queryFn: () => api.getAuthed<LibrarySummary>("/me/library"),
    enabled: status === "authenticated",
  });
}

export function useSaveBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) =>
      api.postAuthed<{ book_id: string; status: string }>(`/me/library/${bookId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useUnsaveBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => api.deleteAuthed<void>(`/me/library/${bookId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

// --- Bookmarks ---

export function useBookmarks() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api.getAuthed<Bookmark[]>("/me/bookmarks"),
    enabled: status === "authenticated",
  });
}

export function useBookBookmarks(bookId: string | undefined) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["bookmarks", bookId],
    queryFn: () => api.getAuthed<Bookmark[]>(`/me/books/${bookId}/bookmarks`),
    enabled: Boolean(bookId) && status === "authenticated",
  });
}

export function useCreateBookmark(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookmarkCreateInput) =>
      api.postAuthed<Bookmark>(`/me/books/${bookId}/bookmarks`, {
        location: input.location,
        note: input.note ?? "",
      }),
    onMutate: async (input) => {
      // Optimistic insert: the panel updates the instant the user bookmarks,
      // then reconciles with the server response on settle.
      await qc.cancelQueries({ queryKey: ["bookmarks"] });
      const optimistic: Bookmark = {
        id: `temp-${Date.now()}`,
        book_id: bookId,
        location: input.location,
        note: input.note ?? "",
        created_at: new Date().toISOString(),
      };
      const prevBook = qc.getQueryData<Bookmark[]>(["bookmarks", bookId]);
      const prevAll = qc.getQueryData<Bookmark[]>(["bookmarks"]);
      qc.setQueryData<Bookmark[]>(["bookmarks", bookId], [
        ...(prevBook ?? []),
        optimistic,
      ]);
      qc.setQueryData<Bookmark[]>(["bookmarks"], [...(prevAll ?? []), optimistic]);
      return { prevBook, prevAll };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prevBook) qc.setQueryData(["bookmarks", bookId], ctx.prevBook);
      if (ctx?.prevAll) qc.setQueryData(["bookmarks"], ctx.prevAll);
    },
    onSuccess: (created) => {
      // Replace the temp optimistic row with the server's canonical record.
      qc.setQueryData<Bookmark[]>(["bookmarks", bookId], (old) =>
        old?.map((b) => (b.id.startsWith("temp-") ? created : b)) ?? [created],
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useDeleteBookmark(bookId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookmarkId: string) =>
      api.deleteAuthed<void>(`/me/bookmarks/${bookmarkId}`),
    onMutate: async (bookmarkId) => {
      // Optimistic removal so the list reacts immediately.
      await qc.cancelQueries({ queryKey: ["bookmarks"] });
      const prevBook = bookId
        ? qc.getQueryData<Bookmark[]>(["bookmarks", bookId])
        : undefined;
      const prevAll = qc.getQueryData<Bookmark[]>(["bookmarks"]);
      if (bookId) {
        qc.setQueryData<Bookmark[]>(["bookmarks", bookId], (old) =>
          old?.filter((b) => b.id !== bookmarkId),
        );
      }
      qc.setQueryData<Bookmark[]>(["bookmarks"], (old) =>
        old?.filter((b) => b.id !== bookmarkId),
      );
      return { prevBook, prevAll };
    },
    onError: (_err, _id, ctx) => {
      if (bookId && ctx?.prevBook) qc.setQueryData(["bookmarks", bookId], ctx.prevBook);
      if (ctx?.prevAll) qc.setQueryData(["bookmarks"], ctx.prevAll);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

// --- Reading progress ---

export function useProgress(bookId: string | undefined) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["progress", bookId],
    queryFn: () =>
      api.getAuthed<ReadingProgress>(`/me/books/${bookId}/progress`),
    enabled: Boolean(bookId) && status === "authenticated",
    // A reader who never opened the book gets 404 PROGRESS_NOT_FOUND — that is
    // "no progress", so don't retry it (the reader treats it as null).
    retry: (count, error) =>
      !(error instanceof ApiError && error.isNotFound) && count < 1,
  });
}

export function useSaveProgress(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProgressUpsertInput) =>
      api.putAuthed<ReadingProgress>(`/me/books/${bookId}/progress`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress", bookId] });
      qc.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useDeleteProgress(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteAuthed<void>(`/me/books/${bookId}/progress`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress", bookId] });
      qc.invalidateQueries({ queryKey: ["library"] });
    },
  });
}