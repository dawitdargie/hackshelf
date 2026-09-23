type Tone = "accent" | "teal" | "violet" | "amber" | "muted";

const TONES: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent-dark",
  teal: "bg-teal-soft text-teal",
  violet: "bg-violet-soft text-violet",
  amber: "bg-amber-soft text-amber",
  muted: "bg-warm text-ink-3",
};

export function Badge({
  tone = "muted",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${TONES[tone]} ${className ?? ""}`.trim()}
    >
      {children}
    </span>
  );
}
