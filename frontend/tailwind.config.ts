import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f8f7f4", // page background — warm paper
        paper: "#ffffff", // card surface
        ink: "#0c0c0c", // main text
        "ink-2": "#1f1f1f",
        "ink-3": "#4a4a4a",
        muted: "#7a7a7a",
        line: "#e8e6e1", // hairline borders
        "line-2": "#d4d2cc",
        accent: "#00a651", // green accent
        "accent-dark": "#007a3a",
        "accent-soft": "#e6f6ed",
        lime: "#c8f26a",
        warm: "#f3f1ec",
        // category/level accents
        teal: "#0d9488",
        "teal-soft": "#ccfbf1",
        forest: "#047857",
        "forest-soft": "#d1fae5",
        violet: "#7c3aed",
        "violet-soft": "#f5f3ff",
        amber: "#f59e0b",
        "amber-soft": "#fffbeb",
        rose: "#e11d48",
        "rose-soft": "#ffe4e6",
        danger: "#dc2626",
      },
      fontFamily: {
        display: ["var(--font-display)", "Syne", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(12,12,12,0.04)",
        md: "0 10px 30px -12px rgba(12,12,12,0.12)",
        lg: "0 28px 56px -20px rgba(12,12,12,0.16)",
      },
      borderRadius: {
        xl2: "18px",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
    },
  },
  plugins: [],
};
export default config;
