import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchBar } from "@/components/home/SearchBar";
import { BooksSection } from "@/components/home/BooksSection";
import { LevelsSection } from "@/components/home/LevelsSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { CTABand } from "@/components/home/CTABand";
import { LoadingState } from "@/components/ui/LoadingState";

// HackShelf — homepage (Phase 14). Server-rendered for SEO: every section
// fetches the real catalog via the Phase 13 fetch functions and streams in
// through Suspense, with graceful loading/empty states.

// Always render on the server at request time (public catalog pages are SSR).
export const revalidate = 0;

export const metadata: Metadata = {
  title: "HackShelf — Free Hacking Books, Read in Browser",
  description:
    "A curated collection of 100% free, legally hosted hacking and cybersecurity books. Search the catalog, browse by level and category, and read in your browser — no paywalls, no PDF hunting.",
  openGraph: {
    title: "HackShelf — Free Hacking Books, Read in Browser",
    description:
      "A curated collection of 100% free, legally hosted hacking and cybersecurity books. Read in your browser, track your progress.",
    type: "website",
    siteName: "HackShelf",
  },
};

function SectionFallback() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <LoadingState rows={2} />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero — warm band, Syne headline, search into the catalog */}
      <section className="border-b border-line bg-warm">
        <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
          <p className="section-label mb-4">Free &amp; legal · Read in browser</p>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.1] tracking-[-0.02em] text-ink md:text-6xl">
            The hacker&apos;s bookshelf.
            <br />
            <span className="text-accent">100% free.</span> Read in your browser.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-3">
            A curated collection of legally hosted hacking and cybersecurity
            books — from first recon to advanced exploitation. No paywalls, no
            PDFs to hunt down. Just read.
          </p>
          <div className="mt-8">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Popular / highly rated */}
      <Suspense fallback={<SectionFallback />}>
        <BooksSection
          label="Community favorites"
          title="Highest"
          highlight="rated"
          filters={{ sort: "rating", limit: 8 }}
          linkText="All top rated"
        />
      </Suspense>

      {/* Recently added */}
      <div className="bg-warm/60">
        <Suspense fallback={<SectionFallback />}>
          <BooksSection
            label="Fresh off the shelf"
            title="Recently"
            highlight="added"
            filters={{ sort: "newest", limit: 8 }}
            href="/books?sort=newest"
            linkText="See what's new"
          />
        </Suspense>
      </div>

      {/* Levels */}
      <Suspense fallback={<SectionFallback />}>
        <LevelsSection />
      </Suspense>

      {/* Categories */}
      <div className="bg-warm/60">
        <Suspense fallback={<SectionFallback />}>
          <CategoriesSection />
        </Suspense>
      </div>

      <CTABand />
    </>
  );
}
