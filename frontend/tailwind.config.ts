import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0a0e14",        // page background — deep space black
        surface: "#111621",     // card surface
        raised: "#161d2b",      // hover/raised surface
        line: "#1f2937",        // hairline borders
        primary: "#3ddc84",     // matrix green
        "primary-dim": "#2aa865",
        accent: "#22d3ee",      // cyan
        warn: "#fbbf24",
        danger: "#f87171",
        ink: "#e6edf3",         // main text
        muted: "#8b949e",       // secondary text
      },
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
        body: ["ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "Cascadia Code", "Consolas", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(61, 220, 132, 0.15)",
        "glow-sm": "0 0 12px rgba(61, 220, 132, 0.25)",
        card: "0 4px 20px rgba(0,0,0,0.4)",
      },
      keyframes: {
        blink: { "0%, 49%": { opacity: "1" }, "50%, 100%": { opacity: "0" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        blink: "blink 1.1s step-end infinite",
      },
    },
  },
  plugins: [],
};
export default config;
