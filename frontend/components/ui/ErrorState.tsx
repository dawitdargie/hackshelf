"use client";

export function ErrorState({
  message = "something broke",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="terminal-panel flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p className="font-mono text-sm text-danger">
        <span>[!]</span> {message}
      </p>
      <p className="meta-line">// check your connection and try again</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-sm text-primary transition-all hover:bg-primary/20"
        >
          $ retry
        </button>
      )}
    </div>
  );
}
