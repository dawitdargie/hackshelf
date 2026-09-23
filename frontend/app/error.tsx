"use client";

// HackShelf — route error boundary. Catches render/runtime errors in any page
// segment so a single bad component degrades gracefully instead of replacing
// the whole app with Next.js's generic "Application error" screen.

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center md:px-10">
      <p className="section-label mb-2">Something broke</p>
      <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink md:text-3xl">
        This page couldn&apos;t be displayed
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-3">
        The request failed in the browser. Try again; if it keeps happening,
        reload the page.
      </p>
      {error.digest && <p className="meta-line mt-2">reference: {error.digest}</p>}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          Try again
        </button>
        <Link
          href="/books"
          className="inline-flex rounded-lg border border-line-2 bg-paper px-5 py-3 text-sm font-semibold text-ink-3 transition-colors hover:border-ink hover:text-ink"
        >
          Back to catalog
        </Link>
      </div>
    </div>
  );
}