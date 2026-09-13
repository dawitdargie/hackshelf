import { BookCard } from "@/components/ui/BookCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHead } from "./SectionHead";
import { fetchBookList } from "@/lib/queries";
import type { BookListFilters } from "@/types";

// HackShelf — books rail section (Phase 14). Server component: fetches a
// slice of the catalog and renders it as a responsive BookCard grid.

export async function BooksSection({
  label,
  title,
  highlight,
  filters,
  href = "/books",
  linkText = "View all",
}: {
  label: string;
  title: string;
  highlight?: string;
  filters: BookListFilters;
  href?: string;
  linkText?: string;
}) {
  const list = await fetchBookList(filters).catch(() => null);
  const books = list?.data ?? [];

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <SectionHead label={label} title={title} highlight={highlight} href={href} linkText={linkText} />
      {books.length === 0 ? (
        <EmptyState
          message="Catalog is warming up"
          hint="Books will appear here once they are added"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}