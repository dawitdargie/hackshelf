import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="scanlines border-b border-line bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <p className="meta-line mb-4">$ ./init --shelf --free --legal</p>
        <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          The hacker&apos;s bookshelf.
          <br />
          <span className="text-primary">100% free.</span> Read in your
          browser.
          <span className="ml-1 inline-block h-8 w-3 animate-blink bg-primary align-middle md:h-12 md:w-4" aria-hidden />
        </h1>
        <p className="mt-6 max-w-xl text-muted">
          A curated collection of legally hosted hacking and cybersecurity
          books — from first recon to advanced exploitation. No paywalls, no
          PDFs to hunt down. Just read.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary">$ start_reading</Button>
          <Button variant="ghost">browse_catalog</Button>
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          <Badge tone="primary">100 books</Badge>
          <Badge tone="accent">12 topics</Badge>
          <Badge>cc / open-source / public-domain</Badge>
        </div>
      </div>
    </section>
  );
}
