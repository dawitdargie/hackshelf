"use client";

// HackShelf — reviews & ratings hooks (Phase 13).
// Listing is public; writes are authenticated with ownership handled server-side.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Review } from "@/types";

export function useReviews(bookId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", bookId],
    // GET /books/:id/reviews returns { data: [...] } with no pagination meta,
    // so api.get unwraps it to the review array.
    queryFn: () => api.get<Review[]>(`/books/${bookId}/reviews`),
    enabled: Boolean(bookId),
  });
}

export function useCreateReview(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.postAuthed<Review>(`/books/${bookId}/reviews`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", bookId] });
    },
  });
}

export function useUpdateReview(bookId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, content }: { reviewId: string; content: string }) =>
      api.putAuthed<Review>(`/reviews/${reviewId}`, { content }),
    onSuccess: () => {
      if (bookId) qc.invalidateQueries({ queryKey: ["reviews", bookId] });
    },
  });
}

export function useDeleteReview(bookId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) =>
      api.deleteAuthed<void>(`/reviews/${reviewId}`),
    onSuccess: () => {
      if (bookId) qc.invalidateQueries({ queryKey: ["reviews", bookId] });
    },
  });
}

// --- Ratings ---

/** GET /books/:id/rating — the current user's rating (404 → null). */
export function useMyRating(bookId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["my-rating", bookId],
    queryFn: () => api.getAuthed<{ rating: number }>(`/books/${bookId}/rating`),
    enabled: Boolean(bookId) && enabled,
    // No rating yet is a normal state (404), not an error worth retrying.
    retry: false,
  });
}

export function useUpsertRating(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rating: number) =>
      api.putAuthed<void>(`/books/${bookId}/rating`, { rating }),
    onSuccess: (_data, rating) => {
      // Reflect the user’s own rating right away (the GET is async).
      qc.setQueryData(["my-rating", bookId], { rating });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["book"] });
      qc.invalidateQueries({ queryKey: ["my-rating", bookId] });
    },
  });
}

export function useDeleteRating(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteAuthed<void>(`/books/${bookId}/rating`),
    onSuccess: () => {
      qc.setQueryData(["my-rating", bookId], null);
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["book"] });
      qc.invalidateQueries({ queryKey: ["my-rating", bookId] });
    },
  });
}