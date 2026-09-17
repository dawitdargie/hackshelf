"use client";

// HackShelf — catalog sort dropdown (Phase 15).
// Maps directly to the backend's `sort` query param: newest | rating | most-rated.

export function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="font-mono text-xs font-medium text-ink-3">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink shadow-sm transition-colors focus:border-accent focus:outline-none"
      >
        <option value="">Newest</option>
        <option value="rating">Highest rated</option>
        <option value="most-rated">Most rated</option>
      </select>
    </label>
  );
}