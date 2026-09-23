"use client";

// HackShelf — header (styled to match hack design/index.html):
// centered plain-text nav, icon search button, auth-aware action buttons.
// Client component so the Log in / Sign up / My library / Log out buttons
// react to auth state without a separate wrapper.

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/books", label: "Books" },
  { href: "/levels", label: "Levels" },
  { href: "/categories", label: "Categories" },
];

/** 38×38 ghost icon button, shared by search + mobile menu (mockup .icon-btn). */
function IconButton({
  href,
  label,
  className,
  onClick,
  ariaExpanded,
  ariaControls,
  children,
}: {
  href?: string;
  label: string;
  className?: string;
  onClick?: () => void;
  ariaExpanded?: boolean;
  ariaControls?: string;
  children: React.ReactNode;
}) {
  const classes = className ?? "";
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  );
}

function UserAvatar({ username }: { username: string }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-dark">
      {username.charAt(0).toUpperCase()}
    </span>
  );
}

export function Header() {
  const { user, status, logout } = useAuth();
  // Transparent while the page is at the top; gains the paper background
  // + blur once the user scrolls. Single passive listener, boolean state.
  const [scrolled, setScrolled] = useState(false);
  // Mobile menu drawer (md:hidden).
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // pages can load already scrolled (e.g. anchors)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer on Escape and lock body scroll while open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Over the dark homepage hero (top of page) the header text must be light;
  // once the paper background slides in, ink colors take over. Only the home
  // page has a dark top-of-page background, so the light palette is gated on
  // the route too — other pages load unscrolled on a light background and must
  // always use ink text. The background transition itself is untouched.
  const pathname = usePathname();
  const isDarkHeroRoute = pathname === "/";
  const atTop = !scrolled && isDarkHeroRoute;
  const logoText = atTop ? "text-white" : "text-ink";
  const navLink = `py-1 text-[13.5px] font-medium tracking-[-0.01em] transition-colors hover:text-accent ${
    atTop ? "text-white/75" : "text-ink-3"
  }`;
  const iconBtn = `flex h-[38px] w-[38px] items-center justify-center rounded-[10px] transition-colors ${
    atTop ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-ink-2 hover:bg-warm hover:text-ink"
  }`;
  const ghostBtn = `rounded-[10px] border px-[18px] py-[9px] text-[13.5px] font-semibold tracking-[-0.01em] transition-colors ${
    atTop
      ? "border-white/30 text-white hover:border-white/60 hover:bg-white/10"
      : "border-line-2 text-ink hover:border-ink hover:bg-warm"
  }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? "border-line bg-paper/90 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-4 sm:gap-6 px-4 sm:px-5 md:px-10">
        {/* Logo */}
        <Link
          href="/"
          className={`flex shrink-0 items-center gap-2.5 font-display text-lg font-bold tracking-[-0.03em] transition-colors ${logoText}`}
        >
          <span
            className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-sm font-bold text-lime shadow-sm"
            aria-hidden
          >
            &gt;_
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          Hack<span className="text-accent">Shelf</span>
        </Link>

        {/* Centered nav — plain text links, hover to accent (mockup .nav-main) */}
        <nav
          className="hidden flex-1 items-center justify-center gap-8 md:flex"
          aria-label="Main"
        >
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions: search icon → auth buttons → mobile menu */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <IconButton href="/books" label="Search" className={iconBtn}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </IconButton>

          {/* Authenticated: user menu (library / profile / logout) */}
          {status === "authenticated" && user && (
            <>
              <Link href="/library" className={`${ghostBtn} hidden sm:inline-flex`}>
                My library
              </Link>
              <Link href="/profile" className={`${ghostBtn} hidden sm:inline-flex`}>
                Profile
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className={`${ghostBtn} hidden sm:inline-flex`}>
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.assign("/");
                }}
                className={`${ghostBtn} hidden items-center gap-1.5 sm:inline-flex`}
              >
                <UserAvatar username={user.username} />
                <span>Log out</span>
              </button>
            </>
          )}

          {/* Unauthenticated: public auth links (kept during loading to avoid flash) */}
          {status !== "authenticated" && (
            <>
              <Link href="/login" className={`${ghostBtn} hidden sm:inline-flex`}>
                Log in
              </Link>
              <Link
                href="/signup"
                className={`hidden rounded-[10px] px-[18px] py-[9px] text-[13.5px] font-semibold tracking-[-0.01em] transition-colors sm:inline-flex ${
                  atTop
                    ? "bg-lime text-ink hover:bg-paper"
                    : "bg-ink text-white hover:bg-accent"
                }`}
              >
                Sign up
              </Link>
            </>
          )}

          {/* Mobile menu toggle (md:hidden) — opens the drawer below */}
          <IconButton
            label={menuOpen ? "Close menu" : "Open menu"}
            className={`${iconBtn} md:hidden`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M3 4h12M3 8h12M3 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </IconButton>
        </div>
      </div>

      {/* Mobile drawer — sits under the bar, matches its scrolled styling */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-b transition-[max-height,opacity] duration-300 md:hidden ${
          scrolled ? "border-line" : "border-transparent"
        } ${menuOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="bg-paper/95 px-4 pb-5 pt-2 backdrop-blur-xl sm:px-5">
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-line py-3 text-[15px] font-medium text-ink transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {status === "authenticated" && user ? (
              <>
                <MobileAction href="/library" onClick={() => setMenuOpen(false)}>
                  My library
                </MobileAction>
                <MobileAction href="/profile" onClick={() => setMenuOpen(false)}>
                  Profile
                </MobileAction>
                {user.role === "admin" && (
                  <MobileAction href="/admin" onClick={() => setMenuOpen(false)}>
                    Admin
                  </MobileAction>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    window.location.assign("/");
                  }}
                  className="w-full rounded-[10px] bg-ink px-[18px] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-accent"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <MobileAction href="/login" onClick={() => setMenuOpen(false)}>
                  Log in
                </MobileAction>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-[10px] bg-ink px-[18px] py-3 text-center text-[15px] font-semibold text-white transition-colors hover:bg-accent"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Full-width tap-target action for the mobile drawer (min 44px tall). */
function MobileAction({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="w-full rounded-[10px] border border-line-2 px-[18px] py-3 text-center text-[15px] font-semibold text-ink transition-colors hover:border-ink hover:bg-warm"
    >
      {children}
    </Link>
  );
}
