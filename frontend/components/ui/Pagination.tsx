export function Pagination({
  page,
  totalPages,
  baseHref,
}: {
  page: number;
  totalPages: number;
  baseHref: string;
}) {
  if (totalPages <= 1) return null;
  const sep = baseHref.includes("?") ? "&" : "?";
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 font-mono text-sm"
    >
      <a
        href={`${baseHref}${sep}page=${Math.max(1, page - 1)}`}
        aria-disabled={page === 1}
        className={`rounded border border-line px-3 py-1.5 ${
          page === 1 ? "pointer-events-none opacity-40" : "hover:border-primary/40 hover:text-primary"
        }`}
      >
        &lt; prev
      </a>
      <span className="meta-line px-2">
        page <strong className="text-primary">{page}</strong> / {totalPages}
      </span>
      <a
        href={`${baseHref}${sep}page=${Math.min(totalPages, page + 1)}`}
        aria-disabled={page === totalPages}
        className={`rounded border border-line px-3 py-1.5 ${
          page === totalPages ? "pointer-events-none opacity-40" : "hover:border-primary/40 hover:text-primary"
        }`}
      >
        next &gt;
      </a>
    </nav>
  );
}
