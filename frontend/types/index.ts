// HackShelf — TypeScript types matching the backend API contracts (Phase 13).
// Mirrors backend/internal Go structs exactly.

// --- Taxonomy (books.Level, books.Author, books.Category, books.Topic) ---

export interface Level {
  id: number;
  name: string;
  slug: string;
  /** Present on /levels (and level detail); omitted inside book summaries. */
  book_count?: number;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Present on /categories (and category detail); omitted inside book summaries. */
  book_count?: number;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
}

/** Author with book count + detail variant including books (authors.AuthorDetail). */
export interface AuthorDetail extends Author {
  book_count: number;
  books?: BookSummary[];
}

/** Level with its book summaries (levels.LevelDetail). */
export interface LevelDetail extends Level {
  books: BookSummary[];
}

/** Category with its book summaries (categories.CategoryDetail). */
export interface CategoryDetail extends Category {
  books: BookSummary[];
}

/** Topic with its book summaries (topics.TopicDetail). */
export interface TopicDetail extends Topic {
  books: BookSummary[];
}

// --- Books ---

export interface RatingSummary {
  average: number;
  count: number;
}

/** List-view representation of a book (API spec §10, books.BookSummary). */
export interface BookSummary {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  level: Level;
  /** Primary category for the card's category tag (empty when unclassified). */
  category: Category;
  rating: RatingSummary;
}

/** Detail-view representation of a book (API spec §11, books.Book). */
export interface Book {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_url: string;
  authors: Author[];
  level: Level;
  categories: Category[];
  topics: Topic[];
  source_url: string;
  license: string;
  publication_date: string;
  rating: RatingSummary;
}

/** TOC entry of a chapter (API spec §11b, books.ChapterMeta). */
export interface ChapterMeta {
  id: string;
  slug: string;
  title: string;
  chapter_order: number;
}

/** A full hosted chapter (API spec §11b, books.Chapter). */
export interface Chapter extends ChapterMeta {
  content: string;
}

/** Pagination meta block of list responses (API spec §10, books.PaginationMeta). */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface BookListFilters {
  search?: string;
  level?: string;
  category?: string;
  topic?: string;
  rating?: number;
  sort?: "newest" | "rating" | "most-rated";
  page?: number;
  limit?: number;
}

/** Paginated list envelope: { data: [...], meta: {...} }. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// --- Reviews (reviews.Review) ---

export interface ReviewUser {
  id: string;
  username: string;
}

export interface Review {
  id: string;
  user: ReviewUser;
  content: string;
  created_at: string;
  updated_at: string;
}

// --- Bookmarks (bookmarks.Bookmark) ---

export interface Bookmark {
  id: string;
  book_id: string;
  book_title?: string;
  book_slug?: string;
  location: string;
  note: string;
  created_at: string;
}

export interface BookmarkCreateInput {
  location: string;
  note?: string;
}

// --- Reading progress (progress handler payloads) ---

export interface ReadingProgress {
  book_id: string;
  location: string;
  percentage: number;
  updated_at: string;
}

export interface ProgressUpsertInput {
  location: string;
  percentage: number;
}

// --- Library (library.SummaryResponse, library.ReadingItem) ---

export interface ReadingItem {
  book: BookSummary;
  location: string;
  percentage: number;
}

export interface LibrarySummary {
  saved_books: BookSummary[];
  currently_reading: ReadingItem[];
  progress: ReadingProgress[];
}

// --- Auth ---

export interface User {
  id: string;
  username: string;
  email: string;
  role?: "user" | "admin";
  /** Editable profile fields (PATCH /me). Email is read-only. */
  display_name?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

/** Response of POST /auth/signup and POST /auth/login (auth.AuthResponse). */
export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

/** Response of POST /auth/refresh. */
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

// --- Errors (middleware.AppError envelope) ---

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}