// HackShelf - cover category assignment.
// A book can belong to several categories, but a cover shows one. Rule
// (product decision): give the book the LEAST POPULATED of its categories, so
// catalog diversity is maximised - e.g. "OWASP Top 10:2021" is in both
// Web Security and Application Security, and lands in Web Security because
// fewer books carry that category.
//
// The assignment is computed over the WHOLE catalog (every category's book
// list), never over the currently visible page, so a book shows the same cover
// everywhere: catalog grid, taxonomy pages, home sections and the detail hero.

import { fetchCategories, fetchCategoryBySlug } from "@/lib/queries";
import type { Category, CategoryDetail } from "@/types";

interface BookEntry {
  slug: string;
  categories: Category[];
}

/**
 * Build the book-id -> cover-category map from every category detail.
 *
 * Deterministic: books are visited in slug order and ties are broken by
 * alphabetically smallest category slug, so the same catalog always produces
 * the same covers.
 */
export function buildCoverAssignments(details: CategoryDetail[]): Record<string, Category> {
  const globalCounts = new Map<string, number>();
  const books = new Map<string, BookEntry>();
  const order: string[] = [];

  for (const detail of details) {
    if (!detail?.slug) continue;
    const category: Category = {
      id: detail.id,
      name: detail.name,
      slug: detail.slug,
      description: detail.description ?? "",
    };
    const booksInCategory = detail.books ?? [];
    globalCounts.set(category.slug, booksInCategory.length);

    for (const book of booksInCategory) {
      const entry = books.get(book.id);
      if (entry) {
        entry.categories.push(category);
      } else {
        books.set(book.id, { slug: book.slug, categories: [category] });
        order.push(book.id);
      }
    }
  }

  const assigned = new Map<string, number>();
  const out: Record<string, Category> = {};

  const ordered = order
    .map((id) => ({ id, entry: books.get(id)! }))
    .sort((a, b) => a.entry.slug.localeCompare(b.entry.slug) || a.id.localeCompare(b.id));

  for (const { id: bookId, entry } of ordered) {
    let best: Category | null = null;
    for (const category of entry.categories) {
      if (!best) {
        best = category;
        continue;
      }
      // 1) fewest books already assigned here 2) fewest books overall
      // 3) alphabetical (determinism)
      const candidateCount = assigned.get(category.slug) ?? 0;
      const bestCount = assigned.get(best.slug) ?? 0;
      if (candidateCount !== bestCount) {
        if (candidateCount < bestCount) best = category;
        continue;
      }
      const candidateGlobal = globalCounts.get(category.slug) ?? 0;
      const bestGlobal = globalCounts.get(best.slug) ?? 0;
      if (candidateGlobal !== bestGlobal) {
        if (candidateGlobal < bestGlobal) best = category;
        continue;
      }
      if (category.slug < best.slug) best = category;
    }
    if (best) {
      out[bookId] = best;
      assigned.set(best.slug, (assigned.get(best.slug) ?? 0) + 1);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Server-side accessor with a short in-process cache: server components
// (taxonomy grids, book detail hero) need the same map the client grids use,
// and eight fetches per render would be wasteful.
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { at: number; value: Promise<Record<string, Category>> } | null = null;

export function getCoverAssignments(): Promise<Record<string, Category>> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.value;

  const value = (async () => {
    const { data: categories } = await fetchCategories({ limit: 100 });
    const details = await Promise.all(
      (categories ?? []).map((category) => fetchCategoryBySlug(category.slug)),
    );
    return buildCoverAssignments(details);
  })().catch(() => ({}) as Record<string, Category>);

  cache = { at: now, value };
  return value;
}
