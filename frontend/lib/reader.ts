// HackShelf — reader helpers (Phase 20).
// Pure client-side utilities: progress math, preference storage, and the
// DOM highlight walker for in-chapter search.

export function computePercent(chapterIndex: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(((chapterIndex + 1) / total) * 100);
}

// --- Preferences (font size, reading mode) ---

export type ReadingMode = "light" | "dark";
export const FONT_STEPS = ["text-[15px]", "text-[17px]", "text-[19px]"] as const;
export type FontStep = 0 | 1 | 2;

const FONT_KEY = "hackshelf_reader_font";
const MODE_KEY = "hackshelf_reader_mode";

export function loadFontStep(): FontStep {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem(FONT_KEY);
  const n = Number(raw);
  return (n === 0 || n === 2 ? n : 1) as FontStep;
}

export function saveFontStep(step: FontStep) {
  window.localStorage.setItem(FONT_KEY, String(step));
}

export function loadReadingMode(): ReadingMode {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(MODE_KEY) === "dark" ? "dark" : "light";
}

export function saveReadingMode(mode: ReadingMode) {
  window.localStorage.setItem(MODE_KEY, mode);
}

// --- In-chapter search highlighter ---

export interface SearchResult {
  count: number;
  firstNode: Node | null;
  firstOffset: number;
}

/** Wrap every case-insensitive occurrence of `term` in the container in <mark>. */
export function highlightInChapter(container: HTMLElement, term: string): SearchResult | null {
  clearHighlights(container);
  const normalized = term.trim().toLowerCase();
  if (!normalized) return null;

  let count = 0;
  let firstNode: Node | null = null;
  let firstOffset = 0;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.nodeValue && node.nodeValue.trim()) textNodes.push(node);
  }

  for (const textNode of textNodes) {
    const value = textNode.nodeValue ?? "";
    const lower = value.toLowerCase();
    let index = lower.indexOf(normalized);
    if (index === -1) continue;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    while (index !== -1) {
      count++;
      if (!firstNode) {
        firstNode = textNode;
        firstOffset = index;
      }
      fragment.appendChild(document.createTextNode(value.slice(cursor, index)));
      const mark = document.createElement("mark");
      mark.className = "reader-highlight";
      mark.textContent = value.slice(index, index + normalized.length);
      fragment.appendChild(mark);
      cursor = index + normalized.length;
      index = lower.indexOf(normalized, cursor);
    }
    fragment.appendChild(document.createTextNode(value.slice(cursor)));
    textNode.replaceWith(fragment);
  }

  return { count, firstNode, firstOffset };
}

/** Remove highlight <mark> wrappers created by highlightInChapter. */
export function clearHighlights(container: HTMLElement) {
  container.querySelectorAll("mark.reader-highlight").forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent ?? ""));
    container.normalize();
  });
}