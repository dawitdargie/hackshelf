export function EmptyState({
  message = "no results found",
  hint,
}: {
  message?: string;
  hint?: string;
}) {
  return (
    <div className="terminal-panel flex flex-col items-center gap-2 px-6 py-16 text-center">
      <p className="font-mono text-sm text-muted">
        <span className="text-primary">[x]</span> {message}
      </p>
      {hint && <p className="meta-line">{hint}</p>}
    </div>
  );
}
