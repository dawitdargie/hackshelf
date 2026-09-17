"use client";

// HackShelf — reader controls (Phase 20): font size steps, reading mode,
// fullscreen. Preferences persist in localStorage (client-side only).

import { useCallback, useEffect, useState } from "react";
import {
  FONT_STEPS,
  loadFontStep,
  loadReadingMode,
  saveFontStep,
  saveReadingMode,
  type FontStep,
  type ReadingMode,
} from "@/lib/reader";

export function useReaderPreferences() {
  const [fontStep, setFontStep] = useState<FontStep>(1);
  const [mode, setMode] = useState<ReadingMode>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFontStep(loadFontStep());
    setMode(loadReadingMode());
    setHydrated(true);
  }, []);

  const changeFont = useCallback((step: FontStep) => {
    setFontStep(step);
    saveFontStep(step);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next = m === "light" ? "dark" : "light";
      saveReadingMode(next);
      return next;
    });
  }, []);

  return { fontStep, mode, changeFont, toggleMode, hydrated, fontClass: FONT_STEPS[fontStep] };
}

export function ReaderControls({
  fontStep,
  mode,
  onFontChange,
  onToggleMode,
  containerRef,
}: {
  fontStep: FontStep;
  mode: ReadingMode;
  onFontChange: (step: FontStep) => void;
  onToggleMode: () => void;
  containerRef: React.RefObject<HTMLElement>;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      containerRef.current?.requestFullscreen().catch(() => undefined);
    }
  }

  const btn =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-paper text-ink-3 transition-colors hover:border-ink hover:text-ink";

  return (
    <div className="flex items-center gap-2">
      {/* Font size */}
      <div className="flex overflow-hidden rounded-lg border border-line" role="group" aria-label="Font size">
        {([0, 1, 2] as FontStep[]).map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onFontChange(step)}
            aria-pressed={fontStep === step}
            aria-label={`Font size ${["small", "medium", "large"][step]}`}
            className={`h-9 w-9 text-sm transition-colors ${
              fontStep === step ? "bg-accent-soft font-bold text-accent-dark" : "bg-paper text-ink-3 hover:bg-warm"
            }`}
          >
            A
            <span className={step === 0 ? "text-[10px]" : step === 1 ? "text-[13px]" : "text-[16px]"}>A</span>
          </button>
        ))}
      </div>

      {/* Reading mode */}
      <button type="button" onClick={onToggleMode} className={btn} aria-label={`Switch to ${mode === "light" ? "dark" : "light"} reading mode`}>
        {mode === "light" ? (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Fullscreen */}
      <button type="button" onClick={toggleFullscreen} className={btn} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          {isFullscreen ? (
            <path d="M6 2v4H2M10 14v-4h4M14 6h-4V2M2 10h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M2 6V2h4M14 10v4h-4M10 2h4v4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </button>
    </div>
  );
}