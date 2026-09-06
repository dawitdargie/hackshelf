type Tone = "primary" | "accent" | "muted" | "danger";

const TONES: Record<Tone, string> = {
  primary: "border-primary/40 bg-primary/10 text-primary",
  accent: "border-accent/40 bg-accent/10 text-accent",
  muted: "border-line bg-raised text-muted",
  danger: "border-danger/40 bg-danger/10 text-danger",
};

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
