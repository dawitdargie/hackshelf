import { admin as adminApi } from './api';

export interface AdminBookMeta {
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

export interface AdminChapterInput {
  slug?: string;
  title?: string;
  content: string;
}

export interface AdminBookInput {
  title: string;
  slug?: string;
  description?: string;
  level: string;
  authors?: string[];
  categories?: string[];
  topics?: string[];
  source_url?: string;
  license?: string;
  publication_date?: string;
  cover_url?: string;
  chapters: AdminChapterInput[];
}

/** Row returned by the admin taxonomy create endpoints (and reader lists). */
export interface AdminTaxonomyItem {
  id: string;
  name: string;
  slug: string;
}

/** GET /api/v1/admin/books — list of editable books with chapter counts. */
export async function adminGetBooks<T>(): Promise<T> {
  return adminApi.getBooks<T>();
}

/** GET /api/v1/admin/books/:id — full book with chapters + taxonomy. */
export async function adminGetBook<T>(bookId: string): Promise<T> {
  return adminApi.getBook<T>(bookId);
}

/** POST /api/v1/admin/books — create a new book. */
export async function adminCreateBook<T>(body: unknown): Promise<T> {
  return adminApi.createBook<T>(body);
}

/** PUT /api/v1/admin/books/:id — update an existing book. */
export async function adminUpdateBook<T>(bookId: string, body: unknown): Promise<T> {
  return adminApi.updateBook<T>(bookId, body);
}

/** DELETE /api/v1/admin/books/:id — delete a book. */
export async function adminDeleteBook<T>(bookId: string): Promise<T> {
  return adminApi.deleteBook<T>(bookId);
}

/** POST /api/v1/admin/categories — create a new category. */
export async function adminCreateCategory<T>(name: string): Promise<T> {
  return adminApi.createCategory<T>(name);
}

/** POST /api/v1/admin/topics — create a new topic. */
export async function adminCreateTopic<T>(name: string): Promise<T> {
  return adminApi.createTopic<T>(name);
}

/** POST /api/v1/admin/authors — create a new author. */
export async function adminCreateAuthor<T>(name: string): Promise<T> {
  return adminApi.createAuthor<T>(name);
}
