import { Suspense } from "react";
import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { BooksSection } from "@/components/home/BooksSection";
import { ContinueReadingSection } from "@/components/home/ContinueReadingSection";
import { YourShelfSection } from "@/components/home/YourShelfSection";
import { LevelsSection } from "@/components/home/LevelsSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { CTABand } from "@/components/home/CTABand";
import { LoadingState } from "@/components/ui/LoadingState";

// HackShelf — homepage (Phase 14 + Phase 21).
// Server-rendered for SEO: every catalog section fetches the real catalog via
// the Phase 13 fetch functions and streams in through Suspense. The Continue
// Reading and Your Shelf sections are client components that render nothing for
// unauthenticated visitors (and only activate once auth is resolved).

// Always render on the server at request time (public catalog pages are SSR).
export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HackShelf: Hacking Books, Read in Browser",
  description:
    "A curated collection of legally hosted hacking and cybersecurity books. Search the catalog, browse by level and category, and read in your browser. No paywalls, no PDF hunting.",
  openGraph: {
    title: "HackShelf: Free Hacking Books, Read in Browser",
    description:
      "A curated collection of legally hosted hacking and cybersecurity books. Read in your browser, track your progress.",
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
      {/* Hero — dark hackbg.avif image, lime accents (mockup) */}
      <Hero />

      {/* Continue reading — authenticated only; renders nothing when logged out */}
      <ContinueReadingSection />

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

      {/* Your shelf — authenticated only; renders nothing when logged out or empty */}
      <YourShelfSection />

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
