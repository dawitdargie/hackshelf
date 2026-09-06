import Link from "next/link";

const NAV = [
  { href: "/books", label: "Books" },
  { href: "/levels", label: "Levels" },
  { href: "/categories", label: "Categories" },
  { href: "/authors", label: "Authors" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-base/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          <span className="text-primary">[hack_]</span>shelf
          <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-blink bg-primary" aria-hidden />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-1.5 font-mono text-sm text-muted transition-colors hover:bg-surface hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="rounded px-3 py-1.5 font-mono text-sm text-muted transition-colors hover:text-ink"
          >
            login
          </Link>
          <Link
            href="/signup"
            className="rounded border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-sm font-medium text-primary transition-all hover:bg-primary/20 hover:shadow-glow-sm"
          >
            $ sign_up
          </Link>
          {/* Mobile nav toggle — wired to a details-free client toggle in a later pass */}
          <button
            type="button"
            aria-label="Open menu"
            className="ml-1 rounded border border-line p-1.5 font-mono text-muted md:hidden"
          >
            ≡
          </button>
        </div>
      </div>
    </header>
  );
}
