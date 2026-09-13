import Link from "next/link";

const NAV = [
  { href: "/books", label: "Books" },
  { href: "/levels", label: "Levels" },
  { href: "/categories", label: "Categories" },
  { href: "/authors", label: "Authors" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-10 px-5 md:px-10">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.03em] text-ink">
          <span
            className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-sm font-bold text-lime"
            aria-hidden
          >
            &gt;_
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          Hack<span className="text-accent">Shelf</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-3 transition-colors hover:bg-warm hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-3 transition-colors hover:text-ink"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-dark hover:shadow-md"
          >
            Sign up
          </Link>
          {/* Mobile nav toggle — wired to a client toggle in a later pass */}
          <button
            type="button"
            aria-label="Open menu"
            className="ml-1 rounded-lg border border-line p-2 text-ink-3 md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
