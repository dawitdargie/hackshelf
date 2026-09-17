import { SectionHead } from "@/components/home/SectionHead";
import { BookCard } from "@/components/ui/BookCard";
import { fetchBookList } from "@/lib/queries";
import type { Book } from "@/types";

// HackShelf — related books (Phase 16). Backend has no related-books
// endpoint; closest supported proxy is same-level books via GET /books.

export async function RelatedBooks({ book }: { book: Book }) {
  const res = await fetchBookList({ level: book.level.slug, limit: 8 }).catch(
    () => null,
  );
  const related = (res?.data ?? []).filter((b) => b.id !== book.id).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <SectionHead
        label="Keep going"
        title="You may also"
        highlight="like"
        href={`/books?level=${book.level.slug}`}
        linkText={`All ${book.level.name.toLowerCase()} books`}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {related.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}