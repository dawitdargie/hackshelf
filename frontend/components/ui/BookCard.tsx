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
      className="terminal-panel group relative block overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
    >
      <span className="absolute left-0 top-0 h-full w-0.5 bg-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      <div className="relative aspect-[3/4] overflow-hidden border-b border-line bg-raised">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center scanlines">
            <span className="font-mono text-4xl text-primary/30">&gt;_</span>
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-ink group-hover:text-primary">
          {book.title}
        </h3>
        {book.authors && book.authors.length > 0 && (
          <p className="meta-line truncate">{book.authors.join(", ")}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="meta-line truncate">
            &gt; lvl: <strong>{book.level.name.toLowerCase()}</strong>
          </span>
        </div>
        <RatingStars average={book.rating.average} count={book.rating.count} />
      </div>
    </Link>
  );
}
