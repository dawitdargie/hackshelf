import Link from "next/link";
import type { Category } from "@/types";

// HackShelf — category card (categories index page). Mirrors the mockup's
// .category-card: icon tile with rotating accent tone, name, description,
// book count and arrow.

const TONES = [
  { tile: "bg-teal-soft text-teal", hover: "hover:border-teal" },
  { tile: "bg-violet-soft text-violet", hover: "hover:border-violet" },
  { tile: "bg-amber-soft text-amber", hover: "hover:border-amber" },
  { tile: "bg-forest-soft text-forest", hover: "hover:border-forest" },
];

function categoryIcon(index: number) {
  const icons = [
    <svg key="globe" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 9h13M9 2.5c2 2 3 4 3 6.5s-1 4.5-3 6.5c-2-2-3-4-3-6.5s1-4.5 3-6.5Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>,
    <svg key="shield" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 2 15 4.5v4c0 4.3-2.7 6.9-6 8-3.3-1.1-6-3.7-6-8v-4L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>,
    <svg key="code" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="m6.5 6-3 3 3 3m5-6 3 3-3 3M10 4l-2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    <svg key="phone" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="5" y="2.5" width="8" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 13.5h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>,
    <svg key="api" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M6 4v3m6-3v3m-7 0h8v4a4 4 0 0 1-8 0V7Zm4 8v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    <svg key="cloud" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M5 13.5a3 3 0 0 1-.4-6A4 4 0 0 1 12.4 7 3 3 0 0 1 12 13.5H5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>,
    <svg key="pipe" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2.5 13.5h5a3 3 0 0 0 3-3v-3a3 3 0 0 1 3-3h2m0 0-2-2m2 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    <svg key="net" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="4" r="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4" cy="13" r="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="14" cy="13" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5.8 5 11.2m5-5.4 3 5.4M6 13h6" stroke="currentColor" strokeWidth="1.4" />
    </svg>,
  ];
  return icons[index % icons.length];
}

export function CategoryCard({
  category,
  index,
  count,
}: {
  category: Category;
  index: number;
  count?: number | null;
}) {
  const tone = TONES[index % TONES.length];
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={`paper-card group flex flex-col gap-4 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${tone.hover}`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone.tile}`}>
        {categoryIcon(index)}
      </div>
      <div>
        <div className="font-display text-base font-bold tracking-[-0.02em] text-ink">
          {category.name}
        </div>
        {category.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-3">
            {category.description}
          </p>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
        <span className="meta-line">
          {count !== undefined && count !== null ? (
            <>
              <strong>{count.toLocaleString()}</strong> books
            </>
          ) : (
            "Browse books"
          )}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
          className="text-line-2 transition-all group-hover:translate-x-1 group-hover:text-accent"
        >
          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}