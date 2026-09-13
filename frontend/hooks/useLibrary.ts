"use client";

// HackShelf — library hooks (Phase 13): saved books, bookmarks, reading progress.
// All endpoints are authenticated; queries stay disabled while logged out.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useDeleteBookmark(bookId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookmarkId: string) =>
      api.deleteAuthed<void>(`/me/bookmarks/${bookmarkId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
      if (bookId) qc.invalidateQueries({ queryKey: ["bookmarks", bookId] });
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