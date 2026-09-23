import type { Metadata } from "next";
import { LevelsSection } from "@/components/home/LevelsSection";
import { fetchLevels } from "@/lib/queries";

// HackShelf — levels index. Warm band + the mockup's level-card trio.
// force-dynamic: data comes from the API at request time. Without this, next
// build prerenders the page statically — the build stage can't reach the API,
// so the empty state would be baked into the image forever.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Levels",
  description:
    "Browse free hacking and cybersecurity books by skill level: Beginner, Intermediate and Advanced. All legally hosted and readable in your browser.",
  alternates: { canonical: "/levels" },
};

export default async function LevelsPage() {
  const levels = await fetchLevels().catch((error) => {
    console.error("[levels page] failed to load levels:", error);
    return [];
  });

  return (
    <>
      <section className="border-b border-line bg-warm">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <p className="section-label mb-2">Skill ladder</p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
            Levels
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-3">
            Every book is tagged with one of three skill levels, so pick where you
            are, then read straight in your browser.
          </p>
        </div>
      </section>
      <LevelsSection />
      {levels.length === 0 && (
        <div className="mx-auto max-w-[1440px] px-5 pb-10 md:px-10">
          <div className="paper-card px-6 py-10 text-center text-sm text-ink-3">
            Levels will appear here once the catalog is seeded.
          </div>
        </div>
      )}
    </>
  );
}