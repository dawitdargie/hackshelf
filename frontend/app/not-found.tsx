import Link from "next/link";

// HackShelf — styled 404 (Phase 16), used by notFound() on book details.

export default function NotFound() {
  return (
    <section className="flex min-h-[50vh] items-center justify-center px-5 py-20">
      <div className="paper-card max-w-md px-8 py-12 text-center">
        <p className="font-mono text-5xl font-bold text-line-2">404</p>
        <h1 className="mt-4 font-display text-xl font-bold text-ink">
          This shelf is empty
        </h1>
        <p className="meta-line mt-2">
          The page or book you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/books"
          className="mt-6 inline-flex rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          Browse the catalog
        </Link>
      </div>
    </section>
  );
}