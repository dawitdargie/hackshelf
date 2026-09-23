import Link from "next/link";
import { RatingStars } from "./RatingStars";
import { BookCover } from "./BookCover";
import type { BookCardData } from "./BookCardData";
import type { Category } from "@/types";

export type { BookCardData };

// Book card — mirrors the hack design/index.html catalog card: cover, category
// tag, title, author, rating, and a bottom row with colored level text + a
// "Read now" button that opens the reader.
// `coverCategory` lets a list pass the book's assigned cover category
// (least-populated one, see lib/coverCategory) instead of its primary one.
export function BookCard({
  book,
  coverCategory,
}: {
  book: BookCardData;
  coverCategory?: Category | null;
}) {
  const levelClass = ["beginner", "intermediate", "advanced"].includes(book.level.slug)
    ? book.level.slug
    : "beginner";

  return (
    <div className="book-card group">
      <Link href={`/books/${book.slug}`} aria-label={book.title} className="block focus-visible:outline-none">
        <div className="book-cover-wrap">
          <BookCover
            slug={book.slug}
            title={book.title}
            levelName={book.level.name}
            category={coverCategory ?? book.category ?? null}
          />
        </div>

        {book.category?.name && (
          <div className="book-cat">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M6 1 7.4 4.1 10.8 4.5 8.3 6.8 9 10.2 6 8.5 3 10.2 3.7 6.8 1.2 4.5 4.6 4.1 6 1Z"
                fill="currentColor"
              />
            </svg>
            {book.category.name}
          </div>
        )}

        <h3 className="book-title line-clamp-2">{book.title}</h3>
        {book.authors && book.authors.length > 0 && <p className="book-author">{book.authors.join(", ")}</p>}
        <div className="book-rating">
          <RatingStars average={book.rating.average} />
        </div>
      </Link>

      <div className="book-bottom">
        <span className={`book-level ${levelClass}`}>{book.level.name}</span>
        <Link href={`/read/${book.slug}`} className="book-read-btn" title="Read now" aria-label={`Read ${book.title}`}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M8 3.5C6.8 2.5 5 2.2 2.5 2.2v10c2.5 0 4.3.3 5.5 1.3 1.2-1 3-1.3 5.5-1.3v-10C11 2.2 9.2 2.5 8 3.5Zm0 0v10"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
