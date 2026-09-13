export function EmptyState({
  message = "Nothing here yet",
  hint,
}: {
  message?: string;
  hint?: string;
}) {
  return (
    <div className="paper-card flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="font-mono text-2xl text-line-2">&gt;_</span>
      <p className="text-sm font-medium text-ink-3">{message}</p>
      {hint && <p className="meta-line">{hint}</p>}
    </div>
  );
}
