import { BookCard } from "@/components/ui/BookCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Hero } from "@/components/layout/Hero";
import { SAMPLE_BOOKS } from "@/lib/sample-data";

export default function ShowcasePage() {
  return (
    <div>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="meta-line mb-6">// component showcase — phase 12 demo</h2>

        <h3 className="font-display text-lg font-semibold">Book grid</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SAMPLE_BOOKS.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        <h3 className="mt-12 font-display text-lg font-semibold">Controls & states</h3>
        <div className="mt-4 flex flex-wrap items-start gap-6">
          <div className="space-y-3">
            <Button>$ primary_action</Button>
            <Button variant="terminal">$ terminal_action</Button>
            <Button variant="ghost">ghost_action</Button>
            <Button variant="danger">$ rm -rf session</Button>
          </div>
          <div className="w-64">
            <Input label="search" name="q" placeholder="grep the catalog..." />
            <div className="mt-3">
              <Input label="email" name="email" error="invalid format" />
            </div>
          </div>
          <div className="space-y-2">
            <Badge tone="primary">beginner</Badge>
            <Badge tone="accent">web-security</Badge>
            <Badge>open-source</Badge>
          </div>
        </div>

        <div className="mt-8 max-w-md space-y-4">
          <Pagination page={2} totalPages={7} baseHref="/books" />
          <EmptyState message="no books match 'metasploit paid edition'" hint="try a different query" />
          <LoadingState rows={2} />
          <ErrorState />
        </div>
      </section>
    </div>
  );
}
