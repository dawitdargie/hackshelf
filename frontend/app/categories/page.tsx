import type { Metadata } from "next";
import { CategoryCard } from "@/components/taxonomy/CategoryCard";
import { fetchBookList, fetchCategories } from "@/lib/queries";

// HackShelf — categories index. Mockup-style category cards (icon tile + name
// + book count), each linking to the category page.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Browse free, legally hosted hacking and cybersecurity books. Web security, cloud security, DevSecOps and more.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await fetchCategories({ limit: 50 }).catch((error) => {
    console.error("[categories page] failed to load categories:", error);
    return null;
  });

  // Counts come with /categories. Only fall back to per-category list queries
  // when the API predates the book_count field (one request per category
  // otherwise: this page used to make nine).
  const categoriesWithCounts = categories?.data ?? [];
  const counts = categoriesWithCounts.every((c) => typeof c.book_count === "number")
    ? categoriesWithCounts.map((c) => c.book_count as number)
    : await Promise.all(
        categoriesWithCounts.map((c) =>
          fetchBookList({ category: c.slug, limit: 1 })
            .then((res) => res.meta.total)
            .catch(() => null),
        ),
      );

  return (
    <>
      <section className="border-b border-line bg-warm">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <p className="section-label mb-2">Browse</p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
            Categories
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-3">
            Every book is grouped into high-level categories. Pick an area and
            dive in.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        {!categories || categories.data.length === 0 ? (
          <div className="paper-card px-6 py-10 text-center text-sm text-ink-3">
            Categories will appear here once the catalog is seeded.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.data.map((category, i) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={i}
                count={counts[i]}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}