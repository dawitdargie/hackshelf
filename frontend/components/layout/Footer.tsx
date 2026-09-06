export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-display font-bold">
              <span className="text-primary">[hack_]</span>shelf
            </p>
            <p className="meta-line mt-1">
              // 100% free, legally hosted hacking books
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 font-mono text-sm text-muted" aria-label="Footer">
            <a href="/books" className="hover:text-primary">books</a>
            <a href="/about" className="hover:text-primary">about</a>
            <a href="/legal" className="hover:text-primary">licensing</a>
          </nav>
          <p className="font-mono text-xs text-muted/70">$ exit 0</p>
        </div>
      </div>
    </footer>
  );
}
