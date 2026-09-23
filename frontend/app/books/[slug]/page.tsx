import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BookInfo } from "@/components/book/BookInfo";
import { BookActions } from "@/components/book/BookActions";
import { RelatedBooks } from "@/components/book/RelatedBooks";
import { ReviewsSection } from "@/components/book/ReviewsSection";
import { fetchBookBySlug } from "@/lib/queries";

// HackShelf — book details page (Phase 16). SSR book info + related books;
// actions and reviews are client-interactive.

interface Props {
  params: { slug: string };
}

// cache() dedupes generateMetadata and the page body onto one fetch per request.
const getBook = cache(async (slug: string) => {
  try {
    return await fetchBookBySlug(slug);
  } catch (error) {
    // Surface the real cause (e.g. wrong API URL / API down) — a silent
    // notFound() here makes "book not displaying" undiagnosable.
    console.error(`[book page] failed to load book "${slug}":`, error);
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await getBook(params.slug);
  if (!book) return { title: "Book not found" };

  const description =
    book.description.slice(0, 155) ||
    `Read ${book.title} free in your browser on HackShelf.`;

  return {
    title: book.title,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      title: book.title,
      description,
      type: "article",
      siteName: "HackShelf",
    },
  };
}

export default async function BookDetailsPage({ params }: Props) {
  const book = await getBook(params.slug);
  if (!book) notFound();

  return (
    <>
      <BookInfo book={book} />

      {/* Actions band — client component (save/rating/auth state) */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-10">
          <BookActions bookId={book.id} slug={book.slug} />
        </div>
      </section>

      <RelatedBooks book={book} />
      <ReviewsSection bookId={book.id} />
    </>
  );
}