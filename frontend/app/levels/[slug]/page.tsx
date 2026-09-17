import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxonomyHeader } from "@/components/taxonomy/TaxonomyHeader";
import { BookGrid } from "@/components/taxonomy/BookGrid";
import { fetchLevelBySlug } from "@/lib/queries";

// HackShelf — level page (Phase 17). SSR: name, count, book grid.

interface Props {
  params: { slug: string };
}

async function getLevel(slug: string) {
  try {
    return await fetchLevelBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const level = await getLevel(params.slug);
  if (!level) return { title: "Level not found" };
  return {
    title: `${level.name} Books`,
    description: `Browse ${level.name.toLowerCase()}-level hacking and cybersecurity books — free and legally hosted on HackShelf.`,
    alternates: { canonical: `/levels/${level.slug}` },
    openGraph: {
      title: `${level.name} Books · HackShelf`,
      type: "website",
    },
  };
}

export default async function LevelPage({ params }: Props) {
  const level = await getLevel(params.slug);
  if (!level) notFound();

  return (
    <>
      <TaxonomyHeader
        label="Level"
        name={level.name}
        count={level.books.length}
      />
      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <BookGrid
          books={level.books}
          emptyLabel={`No ${level.name.toLowerCase()} books yet`}
          catalogHref="/books"
        />
      </section>
    </>
  );
}