import Link from "next/link";
import { SectionHead } from "./SectionHead";
import { fetchCategories } from "@/lib/queries";

// HackShelf — browse-by-category section (Phase 14). Server component
// rendering the mockup's category-card rows with colored icon tiles.

interface CategoryVisual {
  icon: React.ReactNode;
  tile: string;
}

const CATEGORY_VISUALS: CategoryVisual[] = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2.5 9h13M9 2.5c-4.5 4-4.5 9 0 13 4.5-4 4.5-9 0-13Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    tile: "bg-teal-soft text-teal",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="1.5" y="1.5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10.5" y="12.5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10.5" y="1.5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4.5 5.5v5a2 2 0 0 0 2 2h4M13.5 10.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    tile: "bg-violet-soft text-violet",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="3.5" y="8" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 8V5.5a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    tile: "bg-accent-soft text-accent-dark",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="4.5" y="5.5" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5.5V3.5M2.5 8h2M13.5 8h2M2.5 11h2M13.5 11h2M7.5 5.5v-2M10.5 5.5v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6.5 9.5h5M6.5 11.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    tile: "bg-amber-soft text-amber",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path d="M9 2.5c3 2.5 6 4.8 6 8A6 6 0 0 1 3 10.5c0-3.2 3-5.5 6-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 6v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    tile: "bg-rose-soft text-rose",
  },
];

function categoryVisual(index: number): CategoryVisual {
  return CATEGORY_VISUALS[index % CATEGORY_VISUALS.length];
}

export async function CategoriesSection({ limit = 6 }: { limit?: number }) {
  const res = await fetchCategories({ limit }).catch(() => null);
  const categories = res?.data ?? [];

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <SectionHead
        label="Explore topics"
        title="Browse by"
        highlight="category"
        href="/categories"
        linkText="All categories"
      />
      {categories.length === 0 ? (
        <div className="paper-card px-6 py-10 text-center text-sm text-ink-3">
          Categories will appear here once the catalog is seeded.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => {
            const visual = categoryVisual(i);
            return (
              <Link
                key={category.id}
                href={`/books?category=${category.slug}`}
                className="paper-card group flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${visual.tile}`}>
                  {visual.icon}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-bold tracking-[-0.01em] text-ink">
                    {category.name}
                  </div>
                  <div className="meta-line">{category.slug.replace(/-/g, " ")}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="ml-auto shrink-0 text-line-2 transition-all group-hover:translate-x-1 group-hover:text-accent">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}