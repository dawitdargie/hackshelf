import type { Category, RatingSummary } from "@/types";

/** Data a book card needs (subset of BookSummary). */
export interface BookCardData {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  level: { name: string; slug: string };
  rating: RatingSummary;
  category?: Category;
  authors?: string[];
}