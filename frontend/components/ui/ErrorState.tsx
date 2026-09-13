"use client";

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="paper-card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p className="text-sm font-medium text-rose">{message}</p>
      <p className="meta-line">Check your connection and try again</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-line-2 bg-paper px-4 py-2 text-sm font-medium text-ink transition-all hover:border-ink"
        >
          Retry
        </button>
      )}
    </div>
  );
}
