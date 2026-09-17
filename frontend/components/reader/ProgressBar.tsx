"use client";

// HackShelf — reading progress bar (Phase 20). Percent = chapter position
// over total chapters; mirrors what the backend stores in `percentage`.

export function ProgressBar({ percent }: { percent: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 w-28 overflow-hidden rounded-full bg-warm"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Book reading progress"
      >
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="meta-line">
        <strong>{pct}%</strong>
      </span>
    </div>
  );
}