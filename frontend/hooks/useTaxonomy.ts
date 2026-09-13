"use client";

// HackShelf — taxonomy query hooks (Phase 13).
// levels, categories, topics, authors (+ by-slug detail variants).

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetchLevels, fetchCategories } from "@/lib/queries";
import type {
  Author,
  AuthorDetail,
  BookSummary,
  Category,
  Level,
  Paginated,
  Topic,
} from "@/types";

export function useLevels() {
  return useQuery({
    queryKey: ["levels"],
    queryFn: fetchLevels,
    staleTime: Infinity,
  });
}

export function useLevel(slug: string | undefined) {
  return useQuery({
    queryKey: ["level", slug],
    queryFn: () => api.get<Level & { books: BookSummary[] }>(`/levels/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useCategories(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => fetchCategories(params),
    staleTime: Infinity,
  });
}

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: ["category", slug],
    queryFn: () => api.get<Category & { books: BookSummary[] }>(`/categories/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useTopics(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["topics", params],
    queryFn: () => api.get<Paginated<Topic>>("/topics", params),
    staleTime: Infinity,
  });
}

export function useTopic(slug: string | undefined) {
  return useQuery({
    queryKey: ["topic", slug],
    queryFn: () => api.get<Topic & { books: BookSummary[] }>(`/topics/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useAuthors(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["authors", params],
    queryFn: () => api.get<Paginated<Author>>("/authors", params),
    staleTime: Infinity,
  });
}

export function useAuthor(slug: string | undefined) {
  return useQuery({
    queryKey: ["author", slug],
    queryFn: () => api.get<AuthorDetail>(`/authors/${slug}`),
    enabled: Boolean(slug),
  });
}