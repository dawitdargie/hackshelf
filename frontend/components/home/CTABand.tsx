import Link from "next/link";

// HackShelf — homepage closing CTA band (Phase 14), matching the mockup's
// dark ink band with lime headline and green action button.

export function CTABand() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
      <div className="rounded-xl2 bg-ink px-6 py-14 text-center shadow-lg md:py-16">
        <p className="section-label mb-3 text-lime">No paywalls · No PDF hunting</p>
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-[1.15] tracking-[-0.02em] text-white md:text-4xl">
          Open the shelf and <span className="text-lime">start reading</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
          Every book on HackShelf is free and legally hosted: open source, CC,
          or public domain. Read it right in your browser.
        </p>
        <Link
          href="/books"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-dark hover:shadow-md"
        >
          Browse the catalog
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
}