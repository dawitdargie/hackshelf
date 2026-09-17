"use client";

// HackShelf — reader search (Phase 20). Client-side search within the
// loaded chapter: highlights matches in the rendered content and jumps to
// the first one. (Searching the whole book client-side would require
// loading every chapter, which the backend design forbids.)

import { FormEvent, useState } from "react";
import { clearHighlights, highlightInChapter } from "@/lib/reader";

export function ReaderSearch({ contentRef }: { contentRef: React.RefObject<HTMLElement> }) {
  const [term, setTerm] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [searched, setSearched] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const container = contentRef.current;
    if (!container) return;
    const result = highlightInChapter(container, term);
    setCount(result?.count ?? 0);
    setSearched(term.trim());
    if (result?.firstNode) {
      (result.firstNode.parentElement ?? container)
        .querySelector("mark.reader-highlight")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function clear() {
    setTerm("");
    setCount(null);
    setSearched("");
    if (contentRef.current) clearHighlights(contentRef.current);
  }

  return (
    <form onSubmit={onSearch} className="flex items-stretch gap-2" role="search">
      <input
        type="search"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          if (!e.target.value) clear();
        }}
        placeholder="Search this chapter…"
        aria-label="Search within chapter"
        className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink shadow-sm placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg border border-line-2 bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:border-ink"
      >
        Find
      </button>
      {count !== null && searched && (
        <span className="meta-line flex items-center" role="status">
          {count} match{count === 1 ? "" : "es"}
        </span>
      )}
    </form>
  );
}