import Image from "next/image";
import Link from "next/link";
import { RatingStars } from "./RatingStars";

export interface BookCardData {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  level: { name: string; slug: string };
  rating: { average: number; count: number };
  authors?: string[];
}

export function BookCard({ book }: { book: BookCardData }) {
  return (
    <Link
      href={`/books/${book.slug}`}
      className="paper-card group relative block overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-[3/4] overflow-hidden border-b border-line bg-warm">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-accent-soft">
            <span className="font-display text-3xl font-bold text-accent/40">&gt;_</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent/50">
              {book.level.name}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-accent-dark">
          {book.title}
        </h3>
        {book.authors && book.authors.length > 0 && (
          <p className="meta-line truncate">{book.authors.join(", ")}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="meta-line truncate">
            <strong>{book.level.name}</strong>
          </span>
        </div>
        <RatingStars average={book.rating.average} count={book.rating.count} />
      </div>
    </Link>
  );
}
