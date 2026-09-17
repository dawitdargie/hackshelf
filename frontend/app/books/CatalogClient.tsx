"use client";

// HackShelf — catalog client shell (Phase 15).
// URL is the single source of truth: reads filters from the query string,
// writes them back with router.replace, fetches via useBooks (backend
// GET /books does all filtering/search/sort/pagination).

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/catalog/SearchBar";
import { FilterSidebar, type CatalogFilters } from "@/components/catalog/FilterSidebar";
import { SortDropdown } from "@/components/catalog/SortDropdown";
import { ResultsGrid } from "@/components/catalog/ResultsGrid";
import { fetchBookList } from "@/lib/queries";
import type { BookListFilters } from "@/types";

function parseFilters(params: URLSearchParams): CatalogFilters {
  return {
    search: params.get("search") ?? "",
    level: params.get("level") ?? "",
    category: params.get("category") ?? "",
    topic: params.get("topic") ?? "",
    rating: params.get("rating") ?? "",
    sort: params.get("sort") ?? "",
  };
}

export function CatalogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // One patch = one URL update. page resets unless it is what changed.
  const update = useCallback(
    (patch: Partial<CatalogFilters> & { page?: number }) => {
      const params = new URLSearchParams(window.location.search);
      const resetsPage = !("page" in patch);
      for (const [key, value] of Object.entries(patch)) {
        if (value) params.set(key, String(value));
        else params.delete(key);
      }
      if (resetsPage) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/books?${qs}` : "/books", { scroll: false });
    },
    [router],
  );

  const apiFilters: BookListFilters = {
    search: filters.search || undefined,
    level: filters.level || undefined,
    category: filters.category || undefined,
    topic: filters.topic || undefined,
    rating: filters.rating ? Number(filters.rating) : undefined,
    sort: (filters.sort || undefined) as BookListFilters["sort"],
    page,
  };

  const result = useQuery({
    queryKey: ["books", apiFilters],
    queryFn: () => fetchBookList(apiFilters),
    placeholderData: keepPreviousData,
  });

  const resultCount = result.data?.meta.total;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      {/* Page head */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-2">Catalog</p>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink md:text-3xl">
            {filters.search ? (
              <>
                Results for <em className="not-italic text-accent">“{filters.search}”</em>
              </>
            ) : (
              "All books"
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {resultCount !== undefined && (
            <span className="meta-line">
              <strong>{resultCount.toLocaleString()}</strong> books
            </span>
          )}
          <SortDropdown value={filters.sort} onChange={(sort) => update({ sort })} />
        </div>
      </div>

      <div className="mb-6">
        <SearchBar initialQuery={filters.search} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <FilterSidebar filters={filters} onChange={update} />

        <div>
          {result.isFetching && result.data && (
            <p className="meta-line mb-3" role="status">
              Updating…
            </p>
          )}
          <ResultsGrid
            result={result.data}
            isLoading={result.isLoading}
            isError={result.isError}
            refetch={() => result.refetch()}
            page={page}
            onClearFilters={() => router.replace("/books", { scroll: false })}
          />
        </div>
      </div>
    </div>
  );
}