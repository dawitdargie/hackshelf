"use client";

// HackShelf — library tabs (Phase 19). Count-aware tab switcher.

export type LibraryTab = "reading" | "saved" | "bookmarks";

const TABS: { id: LibraryTab; label: string }[] = [
  { id: "reading", label: "Reading" },
  { id: "saved", label: "Saved" },
  { id: "bookmarks", label: "Bookmarks" },
];

export function LibraryTabs({
  active,
  counts,
  onChange,
}: {
  active: LibraryTab;
  counts: Record<LibraryTab, number>;
  onChange: (tab: LibraryTab) => void;
}) {
  return (
    <div role="tablist" aria-label="Library sections" className="flex gap-6 border-b border-line">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`-mb-px border-b-2 px-1 pb-2.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
              isActive
                ? "border-accent text-accent-dark"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 ${isActive ? "text-accent" : "text-muted/70"}`}>
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}