export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <p className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.03em]">
              <span
                className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-lime font-mono text-sm font-bold text-ink"
                aria-hidden
              >
                &gt;_
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Hack<span className="text-lime">Shelf</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              A curated collection of 100% free, legally hosted hacking and
              cybersecurity books. Read in your browser, track your progress.
            </p>
          </div>
          <nav className="flex flex-col gap-2 text-sm text-white/60" aria-label="Footer">
            <span className="section-label mb-2 text-lime">Browse</span>
            <a href="/books" className="transition-colors hover:text-white">Books</a>
            <a href="/levels" className="transition-colors hover:text-white">Levels</a>
            <a href="/categories" className="transition-colors hover:text-white">Categories</a>
          </nav>
          <nav className="flex flex-col gap-2 text-sm text-white/60" aria-label="Footer legal">
            <span className="section-label mb-2 text-lime">Project</span>
            <a href="/about" className="transition-colors hover:text-white">About</a>
            <a href="/legal" className="transition-colors hover:text-white">Licensing</a>
          </nav>
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="font-mono text-xs text-white/40">© {new Date().getFullYear()} HackShelf</p>
          <p className="font-mono text-xs text-white/40">exit 0</p>
        </div>
      </div>
    </footer>
  );
}
