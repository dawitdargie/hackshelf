"use client";

// HackShelf — reviews & ratings hooks (Phase 13).
// Listing is public; writes are authenticated with ownership handled server-side.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Paginated, Review } from "@/types";

export function useReviews(
  bookId: string | undefined,
  params: { page?: number; limit?: number } = {},
) {
  return useQuery({
    queryKey: ["reviews", bookId, params],
    queryFn: () => api.get<Paginated<Review>>(`/books/${bookId}/reviews`, params),
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

export function useUpsertRating(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rating: number) =>
      api.putAuthed<void>(`/books/${bookId}/rating`, { rating }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["book"] });
    },
  });
}

export function useDeleteRating(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteAuthed<void>(`/books/${bookId}/rating`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["book"] });
    },
  });
}