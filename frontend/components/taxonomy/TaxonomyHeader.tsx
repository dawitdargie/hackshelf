// HackShelf — taxonomy page header (Phase 17). Server component:
// warm hero band with eyebrow, Syne name, mono book count.

export function TaxonomyHeader({
  label,
  name,
  count,
}: {
  label: string;
  name: string;
  count: number;
}) {
  return (
    <section className="border-b border-line bg-warm">
      <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
        <p className="section-label mb-2">{label}</p>
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
          {name}
        </h1>
        <p className="meta-line mt-3">
          <strong>{count.toLocaleString()}</strong> books
        </p>
      </div>
    </section>
  );
}