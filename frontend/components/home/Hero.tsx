import Link from "next/link";

// HackShelf — homepage hero (styled to match hack design/index.html):
// full-bleed hackbg.avif background, 105deg dark overlay, Syne headline,
// lime eyebrow, lime/outline CTAs, stats row. Styling only — real routes.

const STATS = [
  { value: "100%", label: "Free books" },
  { value: "14+", label: "Topics covered" },
  { value: "100%", label: "Legal & open" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-[560px] items-center bg-[url('/hackbg.avif')] bg-cover bg-center bg-no-repeat md:min-h-[600px] lg:min-h-[680px]">
      {/* 105deg dark overlay — dark left → lighter right (mockup .hero::before) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(8,12,10,0.92)_0%,rgba(8,12,10,0.78)_45%,rgba(8,12,10,0.55)_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 py-[70px] md:px-10 md:py-[100px]">
        <div className="max-w-[640px]">
          {/* Eyebrow — mono, lime (mockup .hero-eyebrow) */}
          <p className="mb-6 inline-flex items-center gap-2.5 font-mono text-xs font-medium tracking-[1px] text-lime">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 3l4 4-4 4M7 11h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            free · legal · no ads
          </p>

          {/* Headline — Syne, clamp 44–72px, white, lime em (mockup .hero h1) */}
          <h1 className="mb-[22px] font-display text-[clamp(2.75rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-2.2px] text-white md:tracking-[-1.5px]">
            Hacking books
            <br />
            you can read <em className="not-italic text-lime">right now.</em>
          </h1>

          {/* Sub — 17.5px white/75 (mockup .hero-sub) */}
          <p className="mb-9 max-w-[500px] text-[17.5px] leading-[1.7] text-white/75">
            A curated library of legally redistributable security books. Open
            any title in your browser and start learning. no downloads, no
            paywalls.
          </p>

          {/* CTAs — lime solid + white outline (mockup .btn-dark / .btn-outline) */}
          <div className="mb-10 flex flex-wrap gap-[14px]">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-xl bg-lime px-7 py-[15px] text-[15px] font-semibold tracking-[-0.01em] text-ink transition-colors hover:bg-paper"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2.5h4a2 2 0 0 1 2 2v9a1.5 1.5 0 0 0-1.5-1.5H2v-9.5ZM14 2.5h-4a2 2 0 0 0-2 2v9a1.5 1.5 0 0 1 1.5-1.5H14V2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              Browse the shelf
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-[15px] text-[15px] font-semibold tracking-[-0.01em] text-white transition-colors hover:border-white/55 hover:bg-white/10"
            >
              Create free account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}