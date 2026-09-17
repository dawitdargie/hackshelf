"use client";

// HackShelf — catalog filter sidebar (Phase 15).
// Every filter maps 1:1 to a backend GET /books query param:
// level, category, topic, rating. Combinable; clear-all resets the URL.

import { useCategories, useLevels, useTopics } from "@/hooks/useTaxonomy";

export interface CatalogFilters {
  search: string;
  level: string;
  category: string;
  topic: string;
  rating: string;
  sort: string;
}

export function FilterSidebar({
  filters,
  onChange,
}: {
  filters: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
}) {
  const levels = useLevels();
  const categories = useCategories({ limit: 12 });
  const topics = useTopics({ limit: 12 });

  const hasActive = Boolean(
    filters.level || filters.category || filters.topic || filters.rating,
  );

  return (
    <aside>
      {/* Mobile: collapsible */}
      <details className="paper-card px-5 py-4 md:hidden">
        <summary className="cursor-pointer list-none font-display text-sm font-bold text-ink">
          Filters
          {hasActive && <span className="ml-2 font-mono text-xs text-accent">active</span>}
        </summary>
        <div className="mt-4">
          <FilterFields filters={filters} onChange={onChange} levels={levels} categories={categories} topics={topics} />
        </div>
      </details>

      {/* Desktop: sticky sidebar */}
      <div className="paper-card sticky top-[84px] hidden p-5 md:block">
        <div className="mb-4 flex items-center justify-between">
          <span className="section-label">Filters</span>
          {hasActive && (
            <button
              type="button"
              onClick={() => onChange({ level: "", category: "", topic: "", rating: "" })}
              className="text-xs font-medium text-ink-3 underline-offset-2 transition-colors hover:text-accent hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <FilterFields filters={filters} onChange={onChange} levels={levels} categories={categories} topics={topics} />
      </div>
    </aside>
  );
}

// --- Field groups (shared by mobile + desktop renderings) ---

function FilterFields({
  filters,
  onChange,
  levels,
  categories,
  topics,
}: {
  filters: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  levels: ReturnType<typeof useLevels>;
  categories: ReturnType<typeof useCategories>;
  topics: ReturnType<typeof useTopics>;
}) {
  return (
    <div className="space-y-6">
      <FilterGroup label="Level">
        <OptionRow
          options={(levels.data ?? []).map((l) => ({ value: l.slug, label: l.name }))}
          value={filters.level}
          onChange={(value) => onChange({ level: value })}
        />
      </FilterGroup>

      <FilterGroup label="Category">
        <OptionRow
          options={(categories.data?.data ?? []).map((c) => ({ value: c.slug, label: c.name }))}
          value={filters.category}
          onChange={(value) => onChange({ category: value })}
        />
      </FilterGroup>

      <FilterGroup label="Topic">
        <OptionRow
          options={(topics.data?.data ?? []).map((t) => ({ value: t.slug, label: t.name }))}
          value={filters.topic}
          onChange={(value) => onChange({ topic: value })}
        />
      </FilterGroup>

      <FilterGroup label="Minimum rating">
        <OptionRow
          options={[
            { value: "", label: "Any" },
            { value: "4", label: "4★ & up" },
            { value: "3", label: "3★ & up" },
            { value: "2", label: "2★ & up" },
          ]}
          value={filters.rating}
          onChange={(value) => onChange({ rating: value })}
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </div>
      {children}
    </div>
  );
}

/** Single-select rows (mockup category-row style: hover accent, active bold). */
function OptionRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) {
    return <p className="meta-line">Loading…</p>;
  }
  return (
    <ul className="space-y-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <li key={opt.value || "any"}>
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`w-full rounded-lg px-2 py-1 text-left text-sm transition-colors ${
                active
                  ? "bg-accent-soft font-semibold text-accent-dark"
                  : "text-ink-3 hover:bg-warm hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}