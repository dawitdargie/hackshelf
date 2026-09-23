"use client";

// HackShelf — auth page shell (Phase 18 + Phase 21): centered paper card with
// logo, title, and form slot. When the visitor is already signed in the shell
// shows an inline notice (with a sign-out option) instead of redirecting away,
// so a logged-in user can still choose to sign out and create a different account.
//
// The `renderFormIfAuthed` prop (used by password-reset pages) opts a page out
// of the notice and keeps the form visible even when the user is logged in — a
// logged-in visitor may still need to reset a different account's password.

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { PUBLIC_API_URL } from "@/lib/api";

export function AuthShell({
  title,
  subtitle,
  children,
  renderFormIfAuthed = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** When true, render `children` even if the user is already authenticated. */
  renderFormIfAuthed?: boolean;
}) {
  const { user, status } = useAuth();

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

          {/* Authenticated + not opted out → show notice instead of the form */}
          {status === "authenticated" && user && !renderFormIfAuthed && (
            <AlreadySignedInNotice username={user.username} />
          )}

          {/* Loading — keep card visible with a skeleton so layout doesn't shift */}
          {status === "loading" && <AuthShellSkeleton />}

          {/* Unauthenticated, or opted-in authenticated → render the form */}
          {status === "unauthenticated" || renderFormIfAuthed ? (
            children
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Inline notice for authenticated visitors on the login / signup pages. */
function AlreadySignedInNotice({ username }: { username: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-amber-soft px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M8 1.5l6 10H2L8 1.5z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 6v3M8 11.5v.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-sm font-medium text-ink">
          You&apos;re already signed in as <strong>{username}</strong>.
        </p>
      </div>
      <p className="text-sm text-ink-3">
        Sign out to create a different account, or go back to the{" "}
        <Link
          href="/"
          className="font-medium text-accent-dark underline underline-offset-2 hover:text-accent hover:underline"
        >
          home page
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-accent"
      >
        Sign out
      </button>
    </div>
  );
}

/**
 * Sign out the current visitor. Called from the "already signed in" notice on
 * the login / signup pages (outside a React component, so useAuth() is not
 * available). Clears the session cookie and calls the logout endpoint directly
 * — the equivalent of AuthProvider.logout() without the context.
 */
async function handleSignOut() {
  // Best-effort: clear the HttpOnly refresh cookie, then POST /auth/logout.
  // If either call fails the user is still redirected away from the auth page.
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    // cookie clear is best-effort
  }
  try {
    const refreshRes = await fetch("/api/auth/session", { method: "GET" });
    const body = refreshRes.ok
      ? (await refreshRes.json()) as { refresh_token?: string | null }
      : null;
    const refreshToken = body?.refresh_token ?? null;
    if (refreshToken) {
      await fetch(`${PUBLIC_API_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } catch {
    // token may already be expired — proceed with redirect
  }
  window.location.assign("/");
}

/** Skeleton for the form area while auth is resolving on boot. */
function AuthShellSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-full animate-pulse rounded bg-warm" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-warm" />
      <div className="pt-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-warm" />
      </div>
    </div>
  );
}