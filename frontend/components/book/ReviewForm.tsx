"use client";

// HackShelf — review form (Phase 16). Mirrors backend validation:
// content required, max 5000 chars (reviews.MaxContentLength).

import { useState } from "react";
import type { Review } from "@/types";

const MAX_CONTENT_LENGTH = 5000;

export function ReviewForm({
  bookId,
  existing,
  onSubmit,
  onCancel,
  isPending,
  submitLabel = "Post review",
}: {
  bookId: string;
  existing?: Review;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isPending?: boolean;
  submitLabel?: string;
}) {
  const [content, setContent] = useState(existing?.content ?? "");
  const trimmed = content.trim();
  const tooLong = content.length > MAX_CONTENT_LENGTH;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!trimmed || tooLong) return;
        onSubmit(content);
      }}
      className="paper-card p-4"
    >
      <label htmlFor={`review-${bookId}`} className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
        {existing ? "Edit your review" : "Write a review"}
      </label>
      <textarea
        id={`review-${bookId}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Share what this book taught you…"
        className={`w-full resize-y rounded-lg border bg-paper px-3 py-2 text-sm text-ink shadow-sm placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none ${
          tooLong ? "border-rose" : "border-line"
        }`}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`meta-line ${tooLong ? "text-rose" : ""}`}>
          {content.length}/{MAX_CONTENT_LENGTH}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-line-2 bg-paper px-4 py-2 text-sm font-medium text-ink-3 transition-colors hover:border-ink hover:text-ink"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!trimmed || tooLong || isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            {isPending ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}