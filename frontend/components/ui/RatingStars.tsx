export function RatingStars({
  average,
  count,
}: {
  average: number;
  count?: number;
}) {
  const rounded = Math.round(average);
  return (
    <span className="meta-line inline-flex items-center gap-1.5">
      <span aria-hidden className="text-amber">
        {"★".repeat(rounded)}
        <span className="text-line-2">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="font-mono text-ink-3">{average.toFixed(1)}</span>
      {count !== undefined && <span className="font-mono">({count})</span>}
      <span className="sr-only">{`Rating ${average.toFixed(1)} out of 5${
        count !== undefined ? `, ${count} ratings` : ""
      }`}</span>
    </span>
  );
}
