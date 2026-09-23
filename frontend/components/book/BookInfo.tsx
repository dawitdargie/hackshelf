import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { BookCover } from "@/components/ui/BookCover";
import { getCoverAssignments } from "@/lib/coverCategory";
import type { Book } from "@/types";

// HackShelf — book info hero (Phase 16). Server component: static metadata,
// taxonomy badges, rating summary, license/source attribution.

export async function BookInfo({ book }: { book: Book }) {
  const published = book.publication_date
    ? new Date(book.publication_date).getFullYear()
    : null;
  // Same least-populated assignment the card grids use, so the cover a reader
  // saw on the catalog is the cover they see here.
  const coverCategories = await getCoverAssignments();
  const coverCategory = coverCategories[book.id] ?? book.categories[0] ?? null;

  return (
    <section className="border-b border-line bg-warm">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 md:grid-cols-[220px_1fr] md:px-10">
        {/* Cover */}
        <div className="mx-auto aspect-[3/4] w-[220px] max-w-full overflow-hidden paper-card relative">
          <BookCover
            slug={book.slug}
            title={book.title}
            levelName={book.level.name}
            category={coverCategory}
          />
        </div>

        {/* Metadata */}
        <div className="max-w-[640px]">
          <p className="section-label mb-2">{book.level.name}</p>
          <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-4xl">
            {book.title}
          </h1>

          {book.authors.length > 0 && (
            <p className="mt-3 text-[15px] text-ink-3">
              by{" "}
              {book.authors.map((author, i) => (
                <span key={author.id}>
                  {i > 0 && ", "}
                  <Link
                    href={`/authors/${author.slug}`}
                    className="font-medium text-ink underline-offset-2 hover:text-accent hover:underline"
                  >
                    {author.name}
                  </Link>
                </span>
              ))}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <RatingStars average={book.rating.average} count={book.rating.count} />
            {published && <span className="meta-line">· {published}</span>}
          </div>

          {book.description && (
            <p className="mt-5 text-[15px] leading-relaxed text-ink-3">{book.description}</p>
          )}

          {/* Taxonomy badges */}
          <div className="mt-5 flex flex-wrap gap-2">
            {book.categories.map((category) => (
              <Link key={category.id} href={`/books?category=${category.slug}`}>
                <Badge tone="teal">{category.name}</Badge>
              </Link>
            ))}
            {book.topics.map((topic) => (
              <Link key={topic.id} href={`/books?topic=${topic.slug}`}>
                <Badge tone="violet">{topic.name}</Badge>
              </Link>
            ))}
          </div>

          {/* License / source attribution — informational only, never a reading path */}
          <div className="meta-line mt-6 space-y-1 border-t border-line pt-4">
            {book.license && (
              <p>
                License: <strong>{book.license}</strong>
              </p>
            )}
            {book.source_url && (
              <p className="break-all">
                Source:{" "}
                <a
                  href={book.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-ink"
                >
                  {book.source_url}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}