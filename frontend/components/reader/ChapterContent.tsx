"use client";

// HackShelf — chapter content (Phase 20). Renders the hosted markdown with
// marked; exposes a ref for the search highlighter and applies reading prefs.

import { useMemo } from "react";
import { marked } from "marked";
import type { Chapter } from "@/types";

export function ChapterContent({
  chapter,
  fontClass,
  mode,
}: {
  chapter: Chapter | undefined;
  fontClass: string;
  mode: "light" | "dark";
}) {
  const html = useMemo(
    () => (chapter ? marked.parse(chapter.content, { async: false }) as string : ""),
    [chapter],
  );

  if (!chapter) {
    return (
      <div className="paper-card px-6 py-14 text-center text-sm text-ink-3">
        Select a chapter from the table of contents.
      </div>
    );
  }

  return (
    <article
      // System-seeded content (Phase 21) rendered as markdown.
      dangerouslySetInnerHTML={{ __html: html }}
      className={`reader-prose ${fontClass} ${
        mode === "dark" ? "reader-prose--dark" : ""
      }`}
    />
  );
}