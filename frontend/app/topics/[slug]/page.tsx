import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxonomyHeader } from "@/components/taxonomy/TaxonomyHeader";
import { BookGrid } from "@/components/taxonomy/BookGrid";
import { fetchTopicBySlug } from "@/lib/queries";

// HackShelf — topic page (Phase 17). SSR: name, count, book grid.

interface Props {
  params: { slug: string };
}

async function getTopic(slug: string) {
  try {
    return await fetchTopicBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await getTopic(params.slug);
  if (!topic) return { title: "Topic not found" };
  return {
    title: `${topic.name} Books`,
    description: `Browse free, legally hosted books about ${topic.name.toLowerCase()} on HackShelf.`,
    alternates: { canonical: `/topics/${topic.slug}` },
    openGraph: {
      title: `${topic.name} Books · HackShelf`,
      type: "website",
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const topic = await getTopic(params.slug);
  if (!topic) notFound();

  return (
    <>
      <TaxonomyHeader
        label="Topic"
        name={topic.name}
        count={topic.books.length}
      />
      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <BookGrid
          books={topic.books}
          emptyLabel={`No books about ${topic.name.toLowerCase()} yet`}
          catalogHref="/books"
        />
      </section>
    </>
  );
}