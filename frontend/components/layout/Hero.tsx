import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
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
        <div className="mt-8 flex flex-wrap gap-3">
          <Button>Start reading</Button>
          <Button variant="ghost">Browse the catalog</Button>
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          <Badge tone="accent">100 books</Badge>
          <Badge tone="teal">12 topics</Badge>
          <Badge>cc / open-source / public-domain</Badge>
        </div>
      </div>
    </section>
  );
}
