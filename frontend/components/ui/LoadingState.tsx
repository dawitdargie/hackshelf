export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="paper-card relative h-20 overflow-hidden p-4"
        >
          <div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-warm to-transparent"
            style={{ animation: `shimmer 1.4s ${i * 0.12}s infinite` }}
          />
          <div className="h-4 w-1/3 rounded bg-warm" />
          <div className="mt-3 h-3 w-2/3 rounded bg-warm" />
        </div>
      ))}
    </div>
  );
}
