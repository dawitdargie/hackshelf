import Link from "next/link";

// HackShelf — editorial section heading, matching the mockup's section-head:
// mono uppercase label on the left, Syne title, optional trailing link.

export function SectionHead({
  label,
  title,
  highlight,
  href,
  linkText,
}: {
  label: string;
  title: string;
  highlight?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <p className="section-label mb-2">{label}</p>
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink md:text-3xl">
          {title} {highlight && <em className="not-italic text-accent">{highlight}</em>}
        </h2>
      </div>
      {href && linkText && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-2 text-sm font-semibold text-ink-3 transition-colors hover:text-accent-dark sm:inline-flex"
        >
          {linkText}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}