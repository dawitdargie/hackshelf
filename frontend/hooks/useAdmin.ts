"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminGetBooks,
  adminGetBook,
  adminCreateBook,
  adminUpdateBook,
  adminDeleteBook,
  adminCreateCategory,
  adminCreateTopic,
  adminCreateAuthor,
} from "@/lib/admin";
import type { AdminBookMeta, AdminBookInput, AdminTaxonomyItem } from "@/lib/admin";

export interface AdminBookRow {
  id: string;
  slug: string;
  title: string;
  level: string;
  chapter_count: number;
  created_at: string;
  updated_at: string;
  authors: string[];
  categories: string[];
  topics: string[];
}

function toRow(m: AdminBookMeta): AdminBookRow {
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    level: m.level,
    chapter_count: m.chapter_count,
    created_at: m.created_at,
    updated_at: m.updated_at,
    authors: m.authors ?? [],
    categories: m.categories ?? [],
    topics: m.topics ?? [],
  };
}

/** GET /api/v1/admin/books — editable book list with chapter counts. */
export function useAdminBooks() {
  return useQuery({
    queryKey: ["admin", "books"],
    queryFn: async () => {
      const data = await adminGetBooks<AdminBookMeta[]>();
      return data.map(toRow);
    },
  });
}

export interface AdminBookDetail extends AdminBookMeta {
  description: string;
  source_url: string;
  license: string;
  publication_date: string;
  cover_url: string;
  chapters: Array<{
    id: string;
    slug: string;
    title: string;
    chapter_order: number;
    content: string;
  }>;
}

/** GET /api/v1/admin/books/:id — full book with chapters + taxonomy slug arrays. */
export function useAdminBook(bookId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "books", bookId],
    queryFn: () => adminGetBook<AdminBookDetail>(bookId!),
    enabled: Boolean(bookId),
  });
}

/** POST /api/v1/admin/books — create a new book. */
export function useCreateAdminBook() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: AdminBookInput) => adminCreateBook<AdminBookMeta>(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "books"] });
      // Reader-facing catalog caches, so new books appear without a reload.
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["levels"] });
      qc.invalidateQueries({ queryKey: ["level"] });
    },
  });
  return mutation;
}

/** PUT /api/v1/admin/books/:id — update an existing book. */
export function useUpdateAdminBook() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminBookInput }) =>
      adminUpdateBook<AdminBookMeta>(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      // Slug/level could have changed; refresh every detail + chapter cache.
      qc.invalidateQueries({ queryKey: ["book"] });
      qc.invalidateQueries({ queryKey: ["chapters"] });
      qc.invalidateQueries({ queryKey: ["chapter"] });
      qc.invalidateQueries({ queryKey: ["level"] });
    },
  });
  return mutation;
}

/** DELETE /api/v1/admin/books/:id — delete a book. */
export function useDeleteAdminBook() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => adminDeleteBook<{ deleted: string }>(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["book"] });
      qc.invalidateQueries({ queryKey: ["chapters"] });
      qc.invalidateQueries({ queryKey: ["chapter"] });
      qc.invalidateQueries({ queryKey: ["level"] });
      qc.invalidateQueries({ queryKey: ["library"] });
    },
  });
  return mutation;
}

/**
 * POST /api/v1/admin/authors — create (or fetch) an author by name. The
 * backend upserts by slug and answers 201 with the stored row either way, so
 * the editor can select the returned slug immediately.
 */
export function useCreateAdminAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => adminCreateAuthor<AdminTaxonomyItem>(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["authors"] });
      qc.invalidateQueries({ queryKey: ["author"] });
    },
  });
}

/** POST /api/v1/admin/categories — create (or fetch) a category by name. */
export function useCreateAdminCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => adminCreateCategory<AdminTaxonomyItem>(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["category"] });
      qc.invalidateQueries({ queryKey: ["cover-assignments"] });
    },
  });
}

/** POST /api/v1/admin/topics — create (or fetch) a topic by name. */
export function useCreateAdminTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => adminCreateTopic<AdminTaxonomyItem>(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["topic"] });
    },
  });
}
