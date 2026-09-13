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
      className="flex items-center justify-center gap-2 text-sm"
    >
      <a
        href={`${baseHref}${sep}page=${Math.max(1, page - 1)}`}
        aria-disabled={page === 1}
        className={`paper-card px-3 py-1.5 font-medium text-ink-3 ${
          page === 1 ? "pointer-events-none opacity-40" : "hover:border-ink hover:text-ink"
        }`}
      >
        &lt; prev
      </a>
      <span className="meta-line px-2">
        page <strong>{page}</strong> / {totalPages}
      </span>
      <a
        href={`${baseHref}${sep}page=${Math.min(totalPages, page + 1)}`}
        aria-disabled={page === totalPages}
        className={`paper-card px-3 py-1.5 font-medium text-ink-3 ${
          page === totalPages ? "pointer-events-none opacity-40" : "hover:border-ink hover:text-ink"
        }`}
      >
        next &gt;
      </a>
    </nav>
  );
}
