import Link from "next/link";

// HackShelf — header (styled to match hack design/index.html):
// centered plain-text nav, icon search button, bordered login, ink signup.

const NAV = [
  { href: "/books", label: "Books" },
  { href: "/levels", label: "Levels" },
  { href: "/categories", label: "Categories" },
  { href: "/authors", label: "Authors" },
];

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3 4h12M3 8h12M3 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** 38×38 ghost icon button, shared by search + mobile menu (mockup .icon-btn). */
function IconButton({ href, label, children }: { href?: string; label: string; children: React.ReactNode }) {
  const classes =
    "flex h-[38px] w-[38px] items-center justify-center rounded-[10px] text-ink-2 transition-colors hover:bg-warm hover:text-ink";
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} title={label} className={`${classes} md:hidden`}>
      {children}
    </button>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-6 px-5 md:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-display text-lg font-bold tracking-[-0.03em] text-ink"
        >
          <span
            className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-sm font-bold text-lime"
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
            <Link
              key={item.href}
              href={item.href}
              className="py-1 text-[13.5px] font-medium tracking-[-0.01em] text-ink-3 transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions: search icon → login → signup free → mobile menu */}
        <div className="ml-auto flex items-center gap-2">
          <IconButton href="/books" label="Search">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </IconButton>

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
            Sign up free
          </Link>

          <IconButton label="Menu">
            <IconSearch />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
