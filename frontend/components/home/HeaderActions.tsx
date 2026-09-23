"use client";

// HackShelf — header action buttons (auth-aware).
// Extracted from Header.tsx so the header's static nav/logo can stay a server
// component while these buttons react to auth state.

import Link from "next/link";
import { useAuth } from "@/lib/auth";

function UserAvatar({ username }: { username: string }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-dark">
      {username.charAt(0).toUpperCase()}
    </span>
  );
}

export function HeaderActions({ logout }: { logout: () => Promise<void> }) {
  const { user, status } = useAuth();

  return (
    <div className="ml-auto flex items-center gap-2">
      {/* Search — public, always visible */}
      <Link
        href="/books"
        aria-label="Search"
        title="Search"
        className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] text-ink-2 transition-colors hover:bg-warm hover:text-ink"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Link>

      {/* Authenticated: user menu */}
      {status === "authenticated" && user && (
        <>
          <Link
            href="/library"
            className="hidden rounded-[10px] border border-line-2 px-[18px] py-[9px] text-[13.5px] font-semibold tracking-[-0.01em] text-ink transition-colors hover:border-ink hover:bg-warm sm:inline-flex"
          >
            My library
          </Link>
          <Link
            href="/profile"
            className="hidden rounded-[10px] border border-line-2 px-[18px] py-[9px] text-[13.5px] font-semibold tracking-[-0.01em] text-ink transition-colors hover:border-ink hover:bg-warm sm:inline-flex"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-1.5 rounded-[10px] border border-line-2 px-[18px] py-[9px] text-[13.5px] font-semibold tracking-[-0.01em] text-ink transition-colors hover:border-ink hover:bg-warm sm:inline-flex"
          >
            <UserAvatar username={user.username} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </>
      )}

      {/* Unauthenticated: public auth links (same as before, kept during loading too) */}
      {status !== "authenticated" && (
        <>
          <Link
            href="/login"
            className="hidden rounded-[10px] border border-line-2 px-[18px] py-[9px] text-[13.5px] font-semibold tracking-[-0.01em] text-ink transition-colors hover:border-ink hover:bg-warm sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-[10px] bg-ink px-[18px] py-[9px] text-[13.5px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-accent sm:inline-flex"
          >
            Sign up
          </Link>
        </>
      )}

      {/* Mobile menu icon — public, always visible (mirrored from Header.tsx) */}
      <button
        type="button"
        aria-label="Menu"
        title="Menu"
        className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] text-ink-2 transition-colors hover:bg-warm hover:text-ink md:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M3 4h12M3 8h12M3 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
