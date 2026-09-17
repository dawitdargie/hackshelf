import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxonomyHeader } from "@/components/taxonomy/TaxonomyHeader";
import { BookGrid } from "@/components/taxonomy/BookGrid";
import { fetchCategoryBySlug } from "@/lib/queries";

// HackShelf — category page (Phase 17). SSR: name, count, book grid.

interface Props {
  params: { slug: string };
}

async function getCategory(slug: string) {
  try {
    return await fetchCategoryBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(params.slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} Books`,
    description: `Browse free, legally hosted ${category.name.toLowerCase()} books on HackShelf.`,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      title: `${category.name} Books · HackShelf`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await getCategory(params.slug);
  if (!category) notFound();

  return (
    <>
      <TaxonomyHeader
        label="Category"
        name={category.name}
        count={category.books.length}
      />
      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <BookGrid
          books={category.books}
          emptyLabel={`No books in ${category.name} yet`}
          catalogHref="/books"
        />
      </section>
    </>
  );
}