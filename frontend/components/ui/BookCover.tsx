// HackShelf - generated book cover art.
// Category = identity, book = variant:
//   * a category owns a dark hue family (4 shades) and a POOL of 4 shapes
//   * the book's slug hash picks the shade, the shape, the texture, the shape
//     placement/rotation/flip and a secondary decorative layer
// so covers in one category are clearly related but never identical, and the
// eight categories stay visually distinct. Pure CSS + static inline SVG:
// no image requests, no animation, no runtime cost.

export interface BookCoverProps {
  slug: string;
  title: string;
  levelName: string;
  /** Cover category (the least-populated one - see lib/coverCategory). */
  category?: { name: string; slug: string } | null;
  /** compact = tiny thumbnails (no title text), otherwise title is shown */
  compact?: boolean;
  className?: string;
}

type MotifKind =
  | "shield"
  | "bug"
  | "code"
  | "phone"
  | "braces"
  | "cloud"
  | "gear"
  | "network"
  | "target"
  | "lock"
  | "terminal"
  | "hash"
  | "stripes";
type PatternKind = "dots" | "grid" | "diag";
type SecondaryKind = "rings" | "halftone" | "scanlines" | "hatch";

interface Palette {
  from: string;
  to: string;
  accent: string;
}

interface CategoryStyle {
  /** 4 shapes; the first is the category's signature. Slug hash picks one. */
  shapes: MotifKind[];
  /** 4 dark shades of the category hue family. */
  palettes: Palette[];
  /** 2 textures. */
  patterns: PatternKind[];
  /** 2 placements for the shape. */
  positions: string[];
}

/** One style family per seeded category. */
const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "web-security": {
    shapes: ["shield", "target", "lock", "network"],
    patterns: ["dots", "grid"],
    positions: ["-right-5 -top-3 h-32 w-32", "right-1 top-12 h-24 w-24"],
    palettes: [
      { from: "#be123c", to: "#4c0519", accent: "#fb7185" },
      { from: "#9f1239", to: "#3f0d1c", accent: "#f43f5e" },
      { from: "#e11d48", to: "#5b0d1f", accent: "#f472b6" },
      { from: "#a30f34", to: "#45091a", accent: "#ff5d8f" },
    ],
  },
  "application-security": {
    shapes: ["bug", "braces", "gear", "shield"],
    patterns: ["grid", "dots"],
    positions: ["right-2 top-14 h-24 w-24", "-right-4 -top-2 h-28 w-28"],
    palettes: [
      { from: "#6d28d9", to: "#2e1065", accent: "#a78bfa" },
      { from: "#7c3aed", to: "#3b0764", accent: "#8b5cf6" },
      { from: "#9333ea", to: "#4c1d95", accent: "#c084fc" },
      { from: "#5b21b6", to: "#25104f", accent: "#9d7bfa" },
    ],
  },
  "secure-coding": {
    shapes: ["code", "terminal", "braces", "hash"],
    patterns: ["diag", "grid"],
    positions: ["-right-3 top-8 h-28 w-28", "right-4 top-20 h-22 w-22"],
    palettes: [
      { from: "#007a3a", to: "#0c3d22", accent: "#4ade80" },
      { from: "#059669", to: "#064e3b", accent: "#34d399" },
      { from: "#16a34a", to: "#14532d", accent: "#22c55e" },
      { from: "#15803d", to: "#0a2e1a", accent: "#10b981" },
    ],
  },
  "mobile-security": {
    shapes: ["phone", "lock", "shield", "code"],
    patterns: ["dots", "diag"],
    positions: ["right-6 top-10 h-24 w-24", "-right-2 -top-3 h-26 w-26"],
    palettes: [
      { from: "#155e75", to: "#083344", accent: "#22d3ee" },
      { from: "#0369a1", to: "#0c2d48", accent: "#06b6d4" },
      { from: "#0891b2", to: "#164e63", accent: "#2dd4bf" },
      { from: "#0e7490", to: "#0b3844", accent: "#14d3c2" },
    ],
  },
  "api-security": {
    shapes: ["braces", "network", "hash", "gear"],
    patterns: ["grid", "diag"],
    positions: ["-right-2 -top-4 h-32 w-32", "right-3 top-10 h-24 w-24"],
    palettes: [
      { from: "#b45309", to: "#451a03", accent: "#fbbf24" },
      { from: "#d97706", to: "#7c2d12", accent: "#f59e0b" },
      { from: "#ca8a04", to: "#713f12", accent: "#eab308" },
      { from: "#a16207", to: "#422006", accent: "#facc15" },
    ],
  },
  "cloud-security": {
    shapes: ["cloud", "network", "gear", "target"],
    patterns: ["dots", "grid"],
    positions: ["-right-4 top-16 h-28 w-28", "right-2 top-6 h-24 w-24"],
    palettes: [
      { from: "#0284c7", to: "#0c2d48", accent: "#38bdf8" },
      { from: "#0ea5e9", to: "#0f3b57", accent: "#0ea5e9" },
      { from: "#0369a1", to: "#123a5c", accent: "#22d3ee" },
      { from: "#075985", to: "#0a2540", accent: "#12a5e8" },
    ],
  },
  devsecops: {
    shapes: ["gear", "terminal", "code", "hash"],
    patterns: ["diag", "dots"],
    positions: ["-right-6 -top-6 h-36 w-36", "-right-2 top-10 h-28 w-28"],
    palettes: [
      { from: "#1f2937", to: "#0c0c0c", accent: "#a3e635" },
      { from: "#374151", to: "#111827", accent: "#84cc16" },
      { from: "#27272a", to: "#0a0a0a", accent: "#a3e635" },
      { from: "#3f3f46", to: "#131313", accent: "#95d600" },
    ],
  },
  "network-security": {
    shapes: ["network", "cloud", "target", "shield"],
    patterns: ["grid", "dots"],
    positions: ["-right-3 -top-3 h-30 w-30", "right-1 top-16 h-26 w-26"],
    palettes: [
      { from: "#0d9488", to: "#134e4a", accent: "#2dd4bf" },
      { from: "#14b8a6", to: "#115e59", accent: "#14b8a6" },
      { from: "#0f766e", to: "#042f2e", accent: "#0d9488" },
      { from: "#11665e", to: "#063430", accent: "#18c5a8" },
    ],
  },
};

/** Fallback palettes for unknown category slugs (or missing category). */
const FALLBACK_PALETTES: Palette[] = [
  { from: "#007a3a", to: "#0c3d22", accent: "#4ade80" },
  { from: "#0d9488", to: "#134e4a", accent: "#2dd4bf" },
  { from: "#6d28d9", to: "#2e1065", accent: "#a78bfa" },
  { from: "#be123c", to: "#4c0519", accent: "#fb7185" },
  { from: "#b45309", to: "#451a03", accent: "#fbbf24" },
  { from: "#155e75", to: "#083344", accent: "#22d3ee" },
];

const FALLBACK_SHAPES: MotifKind[] = ["stripes", "shield", "code", "network"];
const ANGLES = [140, 170, 100, 125];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function patternStyle(kind: PatternKind): React.CSSProperties {
  switch (kind) {
    case "dots":
      return {
        backgroundImage: "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)",
        backgroundSize: "14px 14px",
      };
    case "grid":
      return {
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      };
    default:
      return {
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 12px)",
      };
  }
}

/** Second decorative layer, varies per book (not per category). */
function secondaryStyle(kind: SecondaryKind, accent: string): React.CSSProperties {
  switch (kind) {
    case "rings":
      return {
        background: `radial-gradient(circle at 78% 22%, ${accent}1f 0 22%, transparent 23%), radial-gradient(circle at 78% 22%, ${accent}14 0 40%, transparent 41%)`,
      };
    case "halftone":
      return {
        backgroundImage: `radial-gradient(${accent}26 1.5px, transparent 1.6px)`,
        backgroundSize: "11px 11px",
      };
    case "scanlines":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${accent}1a 0 1px, transparent 1px 6px)`,
      };
    default:
      return {
        backgroundImage: `repeating-linear-gradient(-30deg, ${accent}1f 0 2px, transparent 2px 14px)`,
      };
  }
}

/** Large faint decorative shape. Static SVG, painted once, no animation. */
function Motif({
  kind,
  accent,
  pos,
  rotate,
  flip,
}: {
  kind: MotifKind;
  accent: string;
  pos: string;
  rotate: number;
  flip: boolean;
}) {
  const common = {
    fill: "none" as const,
    stroke: accent,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const shape = (() => {
    switch (kind) {
      case "shield":
        return (
          <>
            <path d="M50 12l30 10v26c0 20-13 33-30 40-17-7-30-20-30-40V22l30-10z" {...common} />
            <path d="M38 50l9 9 16-18" {...common} />
          </>
        );
      case "bug":
        return (
          <>
            <ellipse cx="50" cy="56" rx="16" ry="20" {...common} />
            <path d="M50 36v40M34 46l-12-6M34 60H20M34 68l-10 8M66 46l12-6M66 60h14M66 68l10 8M38 38l-8-10M62 38l8-10" {...common} />
          </>
        );
      case "code":
        return <path d="M38 28 18 50l20 22M62 28l20 22-20 22M52 22 48 78" {...common} />;
      case "terminal":
        return (
          <>
            <rect x="16" y="22" width="68" height="56" rx="6" {...common} />
            <path d="M30 40l10 10-10 10M48 62h20" {...common} />
          </>
        );
      case "hash":
        return <path d="M30 36h48M26 62h48M40 22 32 78M64 22l-8 56" {...common} />;
      case "phone":
        return (
          <>
            <rect x="34" y="12" width="32" height="76" rx="7" {...common} />
            <path d="M45 20h10" {...common} />
            <circle cx="50" cy="78" r="2.5" fill={accent} stroke="none" />
          </>
        );
      case "braces":
        return (
          <path d="M44 16c-9 0-8 13-8 17s0 13-11 17c11 4 11 13 11 17s-1 17 8 17M56 16c9 0 8 13 8 17s0 13 11 17c-11 4-11 13-11 17s1 17-8 17" {...common} />
        );
      case "cloud":
        return <path d="M30 70a15 15 0 0 1-1-30 21 21 0 0 1 41-4 15 15 0 0 1 3 34H30z" {...common} />;
      case "gear":
        return (
          <>
            <circle cx="50" cy="50" r="13" {...common} />
            <path d="M50 22v-9M50 87v-9M78 50h9M13 50h9M70 30l6-6M24 76l6-6M70 70l6 6M24 24l6 6" {...common} />
          </>
        );
      case "target":
        return (
          <>
            <circle cx="50" cy="50" r="30" {...common} />
            <circle cx="50" cy="50" r="18" {...common} />
            <circle cx="50" cy="50" r="4" fill={accent} stroke="none" />
          </>
        );
      case "lock":
        return (
          <>
            <rect x="28" y="46" width="44" height="34" rx="6" {...common} />
            <path d="M36 46V34a14 14 0 0 1 28 0v12M50 60v8" {...common} />
          </>
        );
      case "network":
        return (
          <>
            <circle cx="30" cy="28" r="7" {...common} />
            <circle cx="72" cy="40" r="7" {...common} />
            <circle cx="46" cy="74" r="7" {...common} />
            <path d="M35 33l32 3M67 46L52 68M41 71l-8-36" {...common} />
          </>
        );
      default:
        return <path d="M60 16 40 50h20L40 84" {...common} />;
    }
  })();
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={`absolute opacity-25 ${pos}`}
      style={{ transform: `rotate(${rotate}deg)${flip ? " scaleX(-1)" : ""}` }}
    >
      {shape}
    </svg>
  );
}

export function BookCover({
  slug,
  title,
  levelName,
  category,
  compact = false,
  className = "",
}: BookCoverProps) {
  // Fold high bits into the hash: raw low bits clump for similar slugs.
  const h0 = hash(slug);
  const h = (h0 ^ (h0 >>> 12) ^ (h0 >>> 24)) >>> 0;

  const style = category ? CATEGORY_STYLES[category.slug] : undefined;
  const palettes = style ? style.palettes : FALLBACK_PALETTES;
  const shapes = style ? style.shapes : FALLBACK_SHAPES;
  const patterns = style ? style.patterns : (["grid", "dots"] as PatternKind[]);
  const positions = style ? style.positions : ["-right-4 -top-2 h-28 w-28", "right-2 top-10 h-24 w-24"];

  const palette = palettes[h % palettes.length];
  const motif = shapes[(h >>> 3) % shapes.length];
  const pattern = patterns[(h >>> 5) % patterns.length];
  const pos = positions[(h >>> 7) % positions.length];
  const flip = ((h >>> 9) & 1) === 1;
  const angle = ANGLES[(h >>> 11) % ANGLES.length];
  const rotate = ((h >>> 13) % 17) - 8; // -8deg .. +8deg
  const secondary: SecondaryKind = (["rings", "halftone", "scanlines", "hatch"] as SecondaryKind[])[
    (h >>> 17) % 4
  ];

  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(${angle}deg, ${palette.from} 0%, ${palette.to} 100%)`,
        color: "#ffffff",
      }}
      role="img"
      aria-label={`Cover of ${title}`}
    >
      {/* Category texture (varies per book) */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={patternStyle(pattern)} />
      {/* Secondary decorative layer (varies per book) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={secondaryStyle(secondary, palette.accent)}
      />
      {/* Category shape (pool pick + rotation + flip, varies per book) */}
      <Motif kind={motif} accent={palette.accent} pos={pos} rotate={rotate} flip={flip} />
      {/* Glow accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl"
        style={{ backgroundColor: `${palette.accent}2e` }}
      />
      {/* Spine highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[6px]"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.12), transparent)" }}
      />

      {/* Level tag */}
      {!compact && (
        <span
          className="absolute left-3.5 top-3 z-10 rounded px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ backgroundColor: `${palette.accent}26`, color: palette.accent }}
        >
          {levelName}
        </span>
      )}

      {compact ? (
        <span
          className="flex h-full w-full items-center justify-center font-display text-lg font-bold"
          style={{ color: `${palette.accent}cc` }}
        >
          &gt;_
        </span>
      ) : (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-1.5 px-4 text-center">
          <span className="font-display text-2xl font-bold leading-none" style={{ color: `${palette.accent}bb` }}>
            &gt;_
          </span>
          <span className="line-clamp-4 font-display text-[13.5px] font-bold leading-[1.3] tracking-[-0.01em] text-white">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
