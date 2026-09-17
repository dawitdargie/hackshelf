"use client";

// HackShelf — taxonomy query hooks (Phase 13).
// levels, categories, topics, authors (+ by-slug detail variants).

import { useQuery } from "@tanstack/react-query";
import {
  fetchLevels,
  fetchCategories,
  fetchTopics,
  fetchAuthors,
  fetchLevelBySlug,
  fetchCategoryBySlug,
  fetchTopicBySlug,
  fetchAuthorBySlug,
} from "@/lib/queries";
import type { AuthorDetail, LevelDetail, CategoryDetail, TopicDetail } from "@/types";

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
    queryFn: () => fetchLevelBySlug(slug!),
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
    queryFn: () => fetchCategoryBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useTopics(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["topics", params],
    queryFn: () => fetchTopics(params),
    staleTime: Infinity,
  });
}

export function useTopic(slug: string | undefined) {
  return useQuery({
    queryKey: ["topic", slug],
    queryFn: () => fetchTopicBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useAuthors(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["authors", params],
    queryFn: () => fetchAuthors(params),
    staleTime: Infinity,
  });
}

export function useAuthor(slug: string | undefined) {
  return useQuery({
    queryKey: ["author", slug],
    queryFn: () => fetchAuthorBySlug(slug!),
    enabled: Boolean(slug),
  });
}

// Re-export detail types for consumers.
export type { LevelDetail, CategoryDetail, TopicDetail, AuthorDetail };