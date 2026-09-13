"use client";

// HackShelf — homepage search bar (Phase 14).
// Client component: submitting navigates to /books?search=… (catalog page).

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchBar({ placeholder = "Search books, topics, authors…" }: { placeholder?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/books?search=${encodeURIComponent(trimmed)}` : "/books");
  }

  return (
    <form onSubmit={onSubmit} role="search" className="w-full max-w-xl">
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
          value={query}
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