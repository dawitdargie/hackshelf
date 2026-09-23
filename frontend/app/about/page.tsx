import type { Metadata } from "next";
import Link from "next/link";

// HackShelf — about page (footer target). Static content from docs/01-PROJECT.md.

export const metadata: Metadata = {
  title: "About",
  description:
    "HackShelf is a curated collection of legally hosted hacking and cybersecurity books. They are readable in your browser, with no paywalls.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line bg-warm">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <p className="section-label mb-2">Project</p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
            About HackShelf
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-10 md:px-10">
        <div className="space-y-6 text-[15px] leading-relaxed text-ink-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink">
          <p>
            HackShelf is a curated free online bookstore for hackers and
            penetration testers. It catalogs only books that may legally be
            redistributed and hosts their content in-system, so every cataloged
            book can be read in your browser, without an external &ldquo;read here&rdquo;
            links, no paywalls, no PDF hunting.
          </p>

          <div>
            <h2 className="mb-2">Only legitimate content</h2>
            <p>
              Every book on HackShelf has a clear source and a license that
              permits redistribution. Open-source, Creative Commons,
              public-domain material, or content published freely by its
              authors. Each book page shows its source URL and license; the
              reader footer repeats the attribution.
            </p>
          </div>

          <div>
            <h2 className="mb-2">Three skill levels</h2>
            <p>
              Books are tagged <strong>Beginner</strong>, <strong>Intermediate</strong>{" "}
              or <strong>Advanced</strong> so you can pick where to start.
              Levels organize the catalog. They are not courses or required
              learning paths.
            </p>
          </div>

          <div>
            <h2 className="mb-2">Your reading, tracked</h2>
            <p>
              Create a free account to save books to your library, rate and
              review them, bookmark exact spots in a chapter, and pick up where
              you left off. Reading progress is saved per book.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/books"
              className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
            >
              Browse the catalog
            </Link>
            <Link
              href="/levels"
              className="inline-flex rounded-lg border border-line-2 bg-paper px-5 py-3 text-sm font-semibold text-ink-3 transition-colors hover:border-ink hover:text-ink"
            >
              See the levels
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}