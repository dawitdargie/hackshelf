import Link from "next/link";
import { SectionHead } from "./SectionHead";
import { fetchCategories } from "@/lib/queries";

// HackShelf — browse-by-category section (Phase 14). Server component
// rendering the mockup's category-card rows with colored icon tiles.

interface CategoryVisual {
  icon: React.ReactNode;
  tile: string;
}

// Hacking-feel line icons (18×18, 1.5 stroke — matches the site's icon style):
// terminal, bug, packet-sniffing Wi-Fi, padlock, code brackets, recon crosshair.
const CATEGORY_VISUALS: CategoryVisual[] = [
  {
    // Terminal / shell — the hacker's home turf
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="1.5" y="2.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4.5 6.5 7 9l-2.5 2.5M9 12h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    tile: "bg-teal-soft text-teal",
  },
  {
    // Bug — malware / vulnerability research
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="6" y="5.5" width="6" height="8.5" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 8H2.5M6 11H3M12 8h3.5M12 11h3M7 5 5.5 2.5M11 5l1.5-2.5M9 5.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    tile: "bg-violet-soft text-violet",
  },
  {
    // Wi-Fi — network / packet sniffing
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path d="M2 7a10 10 0 0 1 14 0M4.5 9.8a6.5 6.5 0 0 1 9 0M7 12.5a3 3 0 0 1 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="15" r="1.2" fill="currentColor" />
      </svg>
    ),
    tile: "bg-accent-soft text-accent-dark",
  },
  {
    // Padlock — crypto / access control
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="4" y="8" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.2 8V5.8a2.8 2.8 0 0 1 5.6 0V8M9 11v1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    tile: "bg-amber-soft text-amber",
  },
  {
    // Code brackets — exploits / source code
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path d="M6 5 2.5 9 6 13M12 5l3.5 4-3.5 4M10.2 3.5 7.8 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    tile: "bg-rose-soft text-rose",
  },
  {
    // Crosshair — recon / OSINT targeting
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
        <path d="M9 1.5v3M9 13.5v3M1.5 9h3M13.5 9h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    tile: "bg-forest-soft text-forest",
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
        href="/books"
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