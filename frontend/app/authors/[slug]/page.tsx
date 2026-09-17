import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxonomyHeader } from "@/components/taxonomy/TaxonomyHeader";
import { BookGrid } from "@/components/taxonomy/BookGrid";
import { fetchAuthorBySlug } from "@/lib/queries";

// HackShelf — author page (Phase 17). SSR: name, count, book grid.
// The backend has no author bio field — frontend does not invent one.

interface Props {
  params: { slug: string };
}

async function getAuthor(slug: string) {
  try {
    return await fetchAuthorBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthor(params.slug);
  if (!author) return { title: "Author not found" };
  return {
    title: `Books by ${author.name}`,
    description: `Browse free, legally hosted books by ${author.name} on HackShelf.`,
    alternates: { canonical: `/authors/${author.slug}` },
    openGraph: {
      title: `Books by ${author.name} · HackShelf`,
      type: "website",
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const author = await getAuthor(params.slug);
  if (!author) notFound();

  return (
    <>
      <TaxonomyHeader
        label="Author"
        name={author.name}
        count={author.book_count}
      />
      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <BookGrid
          books={author.books ?? []}
          emptyLabel={`No books by ${author.name} yet`}
          catalogHref="/books"
        />
      </section>
    </>
  );
}