import Link from "next/link";
import { SectionHead } from "./SectionHead";
import { fetchLevels } from "@/lib/queries";
import { fetchBookList } from "@/lib/queries";
import type { Level } from "@/types";

// HackShelf — levels section (Phase 14). Server component rendering the
// mockup's level-card trio; each card links into the filtered catalog.

interface LevelVisual {
  icon: React.ReactNode;
  accent: string; // icon tile classes
  tone: string; // hover border/accent
}

const VISUALS: Record<string, LevelVisual> = {
  beginner: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M10 16v-5M10 11c0-3-2-5-5-5 0 3 2 5 5 5Zm0 0c0-3 2-5 5-5 0 3-2 5-5 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "bg-accent-soft text-accent-dark",
    tone: "hover:border-accent",
  },
  intermediate: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M10 2.5 16 5v4.5c0 4-2.5 6.7-6 8-3.5-1.3-6-4-6-8V5l6-2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7.5 9.8l1.8 1.8 3.2-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "bg-teal-soft text-teal",
    tone: "hover:border-teal",
  },
  advanced: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 9.5 8.5 12l-5 2.5M16.5 9.5 11.5 12l5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 12v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    accent: "bg-forest-soft text-forest",
    tone: "hover:border-forest",
  },
};

function levelVisual(level: Level, index: number): LevelVisual {
  return VISUALS[level.slug] ?? [VISUALS.beginner, VISUALS.intermediate, VISUALS.advanced][index % 3];
}

const DESCRIPTIONS: Record<string, string> = {
  beginner: "Networking basics, Linux fundamentals, first steps into security. No prerequisites.",
  intermediate: "Exploitation techniques, applied cryptography, practical web and network attacks.",
  advanced: "Binary exploitation, malware reverse engineering, custom tooling and research.",
};

export async function LevelsSection() {
  const levels = await fetchLevels().catch(() => []);

  // Per-level book counts via the filtered list endpoint (1-item pages).
  const counts = await Promise.all(
    levels.map((level) =>
      fetchBookList({ level: level.slug, limit: 1 })
        .then((res) => res.meta.total)
        .catch(() => null),
    ),
  );

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <SectionHead label="Skill ladder" title="Learn at your" highlight="level" href="/books" linkText="All levels" />
      {levels.length === 0 ? (
        <div className="paper-card px-6 py-10 text-center text-sm text-ink-3">
          Levels will appear here once the catalog is seeded.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {levels.map((level, i) => {
            const visual = levelVisual(level, i);
            const count = counts[i];
            return (
              <Link
                key={level.id}
                href={`/books?level=${level.slug}`}
                className={`paper-card group flex flex-col gap-4 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${visual.tone}`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${visual.accent}`}>
                  {visual.icon}
                </div>
                <div>
                  <div className="font-display text-lg font-bold tracking-[-0.02em] text-ink">{level.name}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-3">
                    {DESCRIPTIONS[level.slug] ?? `Explore ${level.name.toLowerCase()}-level books.`}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
                  <span className="meta-line">
                    {count !== null ? (
                      <>
                        <strong>{count.toLocaleString()}</strong> books
                      </>
                    ) : (
                      "Browse books"
                    )}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="text-line-2 transition-all group-hover:translate-x-1 group-hover:text-accent">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}