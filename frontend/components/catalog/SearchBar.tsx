"use client";

// HackShelf — catalog search bar (Phase 15).
// Debounced (350ms) URL-driven search: typing replaces the `search` query
// param on /books; submit is instant. No client-side filtering — the Go
// backend's GET /books does the actual search.

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 350;

export function SearchBar({
  initialQuery = "",
  placeholder = "Search books, topics, authors…",
}: {
  initialQuery?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced URL sync while typing.
  useEffect(() => {
    if (query === initialQuery) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => pushQuery(query), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function pushQuery(value: string) {
    const params = new URLSearchParams(window.location.search);
    const trimmed = value.trim();
    if (trimmed) params.set("search", trimmed);
    else params.delete("search");
    params.delete("page"); // new search → back to page 1
    router.replace(`/books?${params.toString()}`, { scroll: false });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    pushQuery(query);
  }

  return (
    <form onSubmit={onSubmit} role="search" className="w-full">
      <div className="flex items-stretch overflow-hidden rounded-xl border border-line-2 bg-paper shadow-sm transition-all focus-within:border-accent focus-within:shadow-md">
        <span className="flex items-center pl-4 text-muted" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          name="search"
          defaultValue={initialQuery}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search books"
          className="w-full bg-transparent px-3 py-3 font-mono text-sm text-ink placeholder:text-muted/70 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          Search
        </button>
      </div>
    </form>
  );
}