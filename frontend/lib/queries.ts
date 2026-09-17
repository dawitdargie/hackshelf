// HackShelf — shared data fetchers (Phase 14).
// Plain server-safe module: these are called directly by server components
// (homepage sections) and reused by the TanStack Query hooks. No "use client".

import { api } from "@/lib/api";
import type {
  Author,
  BookListFilters,
  Book,
  BookSummary,
  Category,
  Level,
  Paginated,
  Topic,
  LevelDetail,
  CategoryDetail,
  TopicDetail,
  AuthorDetail,
} from "@/types";

export function fetchBookList(filters: BookListFilters = {}) {
  return api.get<Paginated<BookSummary>>("/books", { ...filters });
}

export function fetchLevels() {
  return api.get<Level[]>("/levels");
}

export function fetchCategories(params: { page?: number; limit?: number } = {}) {
  return api.get<Paginated<Category>>("/categories", params);
}

export function fetchTopics(params: { page?: number; limit?: number } = {}) {
  return api.get<Paginated<Topic>>("/topics", params);
}

export function fetchAuthors(params: { page?: number; limit?: number } = {}) {
  return api.get<Paginated<Author>>("/authors", params);
}

export function fetchBookBySlug(slug: string) {
  return api.get<Book>(`/books/${slug}`);
}

export function fetchLevelBySlug(slug: string) {
  return api.get<LevelDetail>(`/levels/${slug}`);
}

export function fetchCategoryBySlug(slug: string) {
  return api.get<CategoryDetail>(`/categories/${slug}`);
}

export function fetchTopicBySlug(slug: string) {
  return api.get<TopicDetail>(`/topics/${slug}`);
}

export function fetchAuthorBySlug(slug: string) {
  return api.get<AuthorDetail>(`/authors/${slug}`);
}