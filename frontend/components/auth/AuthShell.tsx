"use client";

// HackShelf — auth page shell (Phase 18): centered paper card with logo,
// title, and form slot. Redirects authenticated users away.

import Link from "next/link";
import { useRedirectIfAuthed } from "@/lib/auth";

export function AuthShell({
  title,
  subtitle,
  nextPath,
  children,
}: {
  title: string;
  subtitle: string;
  nextPath?: string;
  children: React.ReactNode;
}) {
  const redirect = useRedirectIfAuthed(nextPath ?? "/library");

  if (redirect.isLoading) return null;
  if (redirect.isAuthed) return null;

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-warm px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.03em] text-ink"
            aria-label="HackShelf home"
          >
            <span
              className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-ink font-mono text-sm font-bold text-lime"
              aria-hidden
            >
              &gt;_
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Hack<span className="text-accent">Shelf</span>
          </Link>
        </div>
        <div className="paper-card p-7 shadow-md">
          <h1 className="font-display text-xl font-bold tracking-[-0.02em] text-ink">
            {title}
          </h1>
          <p className="mb-6 mt-1 text-sm text-ink-3">{subtitle}</p>
          {children}
        </div>
      </div>
    </section>
  );
}