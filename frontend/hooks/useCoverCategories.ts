"use client";

// HackShelf - cover category assignment hook (client grids).
// Fetches the ready-made book -> cover-category map from
// /api/cover-assignments (one cacheable request) instead of loading all eight
// category lists in the browser. Values come from the same algorithm the
// server components use, so a card's cover never changes between pages.

import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/types";

export function useCoverAssignments() {
  return useQuery({
    queryKey: ["cover-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/cover-assignments");
      if (!res.ok) throw new Error("Failed to load cover assignments");
      const body = (await res.json()) as { data: Record<string, Category> };
      return body.data ?? {};
    },
    staleTime: Infinity,
  });
}

/**
 * Book-id -> cover category. Returns an empty map while loading, in which case
 * callers fall back to the book's own primary category.
 */
export function useCoverCategoryMap(): Record<string, Category> {
  const { data } = useCoverAssignments();
  return data ?? {};
}
