"use client";

import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  useAdminBook,
  useCreateAdminBook,
  useCreateAdminAuthor,
  useCreateAdminCategory,
  useCreateAdminTopic,
  useUpdateAdminBook,
} from "@/hooks/useAdmin";
import { useAuthors, useCategories, useLevels, useTopics } from "@/hooks/useTaxonomy";
import type { Author, Category, Topic } from "@/types";
import { slugify } from "@/lib/validators";
import { ApiError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ChapterForm {
  slug: string;
  title: string;
  content: string;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  level: string;
  authors: string[];
  categories: string[];
  topics: string[];
  source_url: string;
  license: string;
  publication_date: string;
  cover_url: string;
  chapters: ChapterForm[];
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  level: "intermediate",
  authors: [],
  categories: [],
  topics: [],
  source_url: "",
  license: "",
  publication_date: "",
  cover_url: "",
  chapters: [{ slug: "", title: "", content: "# Chapter 1\n\nContent here..." }],
};

// Chapter title fallback matching the backend's sanitizeChapters: the first
// "# " heading if present, otherwise the humanized slug.
function chapterTitleFrom(content: string, slug: string): string {
  const heading = /^#\s+(.+?)\s*$/m.exec(content);
  if (heading) return heading[1].trim();
  const humanized = slug.replace(/-/g, " ").trim();
  return humanized ? humanized.charAt(0).toUpperCase() + humanized.slice(1) : slug;
}

// ---------------------------------------------------------------------------
// TaxonomyChipPicker — toggleable chips of existing entries plus an inline
// "add" input that creates the entry through the admin taxonomy endpoints
// (which upsert by slug and answer with the stored row) and selects it.
// ---------------------------------------------------------------------------

interface TaxonomyChipPickerProps {
  label: string;
  field: "authors" | "categories" | "topics";
  options: Array<Author | Category | Topic>;
  selected: string[];
  onToggle: (field: "authors" | "categories" | "topics", value: string) => void;
  onSelect: (field: "authors" | "categories" | "topics", value: string) => void;
  onCreate: (field: "authors" | "categories" | "topics", name: string) => Promise<string | null>;
}

function TaxonomyChipPicker({
  label,
  field,
  options,
  selected,
  onToggle,
  onSelect,
  onCreate,
}: TaxonomyChipPickerProps) {
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const handleAdd = async () => {
    const name = draft.trim();
    if (!name || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const slug = await onCreate(field, name);
      if (slug) onSelect(field, slug);
      setDraft("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add entry");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block font-mono text-xs font-medium text-ink-3">
        {label}
        {addError && <span className="ml-2 font-sans text-rose">{addError}</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.slug);
          return (
            <button
              key={opt.slug}
              type="button"
              onClick={() => onToggle(field, opt.slug)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                isSelected
                  ? "border-accent bg-accent text-white"
                  : "border-line-2 bg-paper text-ink-700 hover:border-ink"
              }`}
            >
              {opt.name}
            </button>
          );
        })}
        <input
          type="text"
          value={draft}
          disabled={adding}
          placeholder={adding ? "Adding..." : "Add new..."}
          className="min-w-[120px] flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink-900 placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-60"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          onBlur={() => {
            if (draft.trim()) void handleAdd();
          }}
        />
      </div>
    </div>
  );
}
export default function BookEditorClient({ bookId }: { bookId?: string }) {
  const router = useRouter();
  const { user, status } = useAuth();
  const updateMutation = useUpdateAdminBook();
  const createMutation = useCreateAdminBook();
  const createAuthorMutation = useCreateAdminAuthor();
  const createCategoryMutation = useCreateAdminCategory();
  const createTopicMutation = useCreateAdminTopic();

  // Existing taxonomy entries — chips come from the server so every selected
  // slug resolves on save (the backend replaces associations by slug).
  const levelsQuery = useLevels();
  const authorsQuery = useAuthors({ limit: 100 });
  const categoriesQuery = useCategories({ limit: 100 });
  const topicsQuery = useTopics({ limit: 100 });

  // Edit mode: load the stored book once and hydrate the form from it.
  const bookQuery = useAdminBook(bookId);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(!bookId);
  const [previewChapter, setPreviewChapter] = useState<number | null>(null);
  const [highlightedPreview, setHighlightedPreview] = useState<number | null>(null);
  const previewRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const hydratedFor = useRef<string | undefined>(undefined);

  // Hydrate the form from the fetched book — only once per loaded book, so a
  // background refetch can never clobber in-progress edits.
  useEffect(() => {
    const book = bookQuery.data;
    if (!book || hydratedFor.current === book.id) return;
    hydratedFor.current = book.id;
    setForm({
      title: book.title,
      slug: book.slug,
      description: book.description ?? "",
      level: book.level,
      authors: book.authors ?? [],
      categories: book.categories ?? [],
      topics: book.topics ?? [],
      source_url: book.source_url ?? "",
      license: book.license ?? "",
      publication_date: book.publication_date ?? "",
      cover_url: book.cover_url ?? "",
      chapters: (book.chapters ?? []).map((ch) => ({
        slug: ch.slug,
        title: ch.title,
        content: ch.content,
      })),
    });
    setHydrated(true);
  }, [bookQuery.data]);

  // Warn before closing/refreshing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Wait for the auth session to resolve before judging access, otherwise a
  // slow /me refresh would flash "Access denied" to a signed-in admin.
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm">
        <p className="text-sm text-ink-600">Checking access...</p>
      </div>
    );
  }

  if (status === "authenticated" && user?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink">Access denied</h1>
          <p className="mt-2 text-ink-600">Admin privileges required.</p>
          <Button variant="ghost" className="mt-6" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </div>
    );
  }

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      title: val,
      // Auto-derive the slug only while it still mirrors the title; a
      // hand-edited slug is never clobbered.
      slug: !prev.slug || prev.slug === slugify(prev.title) ? slugify(val) : prev.slug,
    }));
    setDirty(true);
  };

  const updateChapter = (index: number, field: keyof ChapterForm, value: string) => {
    setForm((prev) => {
      const newChapters = [...prev.chapters];
      newChapters[index] = { ...newChapters[index], [field]: value };
      return { ...prev, chapters: newChapters };
    });
    setDirty(true);
  };

  const handleChapterTitleChange = (index: number, value: string) => {
    setForm((prev) => {
      const newChapters = [...prev.chapters];
      const ch = newChapters[index];
      newChapters[index] = {
        ...ch,
        title: value,
        slug: !ch.slug || ch.slug === slugify(ch.title) ? slugify(value) : ch.slug,
      };
      return { ...prev, chapters: newChapters };
    });
    setDirty(true);
  };

  const addChapter = () => {
    const count = form.chapters.length + 1;
    setForm((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        { slug: "", title: "", content: `# Chapter ${count}\n\nContent here...` },
      ],
    }));
    setDirty(true);
  };

  const removeChapter = (index: number) => {
    if (form.chapters.length <= 1) return;
    setForm((prev) => ({ ...prev, chapters: prev.chapters.filter((_, i) => i !== index) }));
    setDirty(true);
    // Keep indices in sync with the remaining chapters.
    setPreviewChapter((p) => (p === null ? null : p === index ? null : p < index ? p : p - 1));
  };

  const moveChapter = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= form.chapters.length) return;
    setForm((prev) => {
      const newChapters = [...prev.chapters];
      [newChapters[index], newChapters[target]] = [newChapters[target], newChapters[index]];
      return { ...prev, chapters: newChapters };
    });
    setDirty(true);
    // The open preview follows its chapter to the new position.
    setPreviewChapter((p) => (p === index ? target : p === target ? index : p));
  };

  // Opens/closes the preview for one chapter. On open it scrolls the preview
  // into view (the panel can sit far below the button in a long chapter list)
  // and flashes a ring around the chapter card so the result is obvious.
  const togglePreview = (index: number) => {
    const isOpen = previewChapter === index;
    setPreviewChapter(isOpen ? null : index);
    if (isOpen) {
      setHighlightedPreview(null);
      return;
    }
    // Wait one frame so the preview panel exists in the DOM before scrolling.
    requestAnimationFrame(() => {
      const panel = previewRefs.current[index];
      if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlightedPreview(index);
      window.setTimeout(() => {
        setHighlightedPreview((current) => (current === index ? null : current));
      }, 1600);
    });
  };

  const toggleTaxonomy = (field: "authors" | "categories" | "topics", value: string) => {
    setForm((prev) => {
      const current = prev[field];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
    setDirty(true);
  };

  const selectTaxonomy = (field: "authors" | "categories" | "topics", value: string) => {
    setForm((prev) =>
      prev[field].includes(value) ? prev : { ...prev, [field]: [...prev[field], value] },
    );
    setDirty(true);
  };

  // Creates the taxonomy entry through the admin API and returns its slug so
  // the picker can select it immediately.
  const handleCreateTaxonomy = async (
    field: "authors" | "categories" | "topics",
    name: string,
  ): Promise<string | null> => {
    if (field === "authors") {
      const row = await createAuthorMutation.mutateAsync(name);
      return row.slug;
    }
    if (field === "categories") {
      const row = await createCategoryMutation.mutateAsync(name);
      return row.slug;
    }
    const row = await createTopicMutation.mutateAsync(name);
    return row.slug;
  };
  const saveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        level: form.level,
        authors: form.authors,
        categories: form.categories,
        topics: form.topics,
        source_url: form.source_url,
        license: form.license,
        publication_date: form.publication_date,
        cover_url: form.cover_url,
        chapters: form.chapters.map((ch, idx) => ({
          // Empty slugs/titles are allowed — the backend fills chapter slugs
          // from titles and falls back to the first "# " heading, mirroring
          // the seeder.
          slug: ch.slug || slugify(ch.title) || `chapter-${idx + 1}`,
          title: ch.title || chapterTitleFrom(ch.content, ch.slug || `chapter-${idx + 1}`),
          content: ch.content,
        })),
      };

      if (bookId) {
        await updateMutation.mutateAsync({ id: bookId, input: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      router.push("/admin");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save book. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = (content: string) => {
    try {
      return { __html: marked.parse(content, { async: false }) };
    } catch {
      return { __html: "<p>Preview unavailable</p>" };
    }
  };

  // Edit mode: block on the book fetch so the form never renders half-empty.
  if (bookId && (bookQuery.isLoading || bookQuery.isError || !hydrated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm">
        <div className="text-center">
          {bookQuery.isError ? (
            <>
              <h1 className="text-2xl font-bold text-ink">Book not found</h1>
              <p className="mt-2 text-ink-600">
                {bookQuery.error instanceof Error
                  ? bookQuery.error.message
                  : "Could not load this book."}
              </p>
              <Button variant="ghost" className="mt-6" onClick={() => router.push("/admin")}>
                Back to admin
              </Button>
            </>
          ) : (
            <p className="text-sm text-ink-600">Loading book...</p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-warm">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">{bookId ? "Edit Book" : "New Book"}</h1>
            {bookId && form.slug && <p className="mt-1 text-sm text-ink-600">/{form.slug}</p>}
          </div>
          <Button variant="ghost" onClick={() => router.push("/admin")}>
            Back to admin
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 p-4 text-rose">
            {error}
          </div>
        )}

        <form onSubmit={saveBook} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Input
              label="Title"
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Book Title"
              required
              className="sm:col-span-2"
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="book-slug"
              required
            />
            <div>
              <label
                htmlFor="book-level"
                className="mb-1.5 block font-mono text-xs font-medium text-ink-3"
              >
                Level
              </label>
              <select
                id="book-level"
                value={form.level}
                onChange={(e) => updateField("level", e.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink shadow-sm transition-all focus:border-accent focus:outline-none"
                required
              >
                {levelsQuery.data?.some((lv) => lv.slug === form.level) && (
                  <option value={form.level} className="hidden">
                    {form.level} (unknown)
                  </option>
                )}
                {(levelsQuery.data ?? []).map((lv) => (
                  <option key={lv.slug} value={lv.slug}>
                    {lv.name}
                  </option>
                ))}
              </select>
              {levelsQuery.isError && (
                <p className="mt-1 text-xs text-rose">Could not load levels</p>
              )}
            </div>
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Short description of the book"
              className="sm:col-span-2"
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <TaxonomyChipPicker
              label="Authors"
              field="authors"
              options={authorsQuery.data?.data ?? []}
              selected={form.authors}
              onToggle={toggleTaxonomy}
              onSelect={selectTaxonomy}
              onCreate={handleCreateTaxonomy}
            />
            <TaxonomyChipPicker
              label="Categories"
              field="categories"
              options={categoriesQuery.data?.data ?? []}
              selected={form.categories}
              onToggle={toggleTaxonomy}
              onSelect={selectTaxonomy}
              onCreate={handleCreateTaxonomy}
            />
            <TaxonomyChipPicker
              label="Topics"
              field="topics"
              options={topicsQuery.data?.data ?? []}
              selected={form.topics}
              onToggle={toggleTaxonomy}
              onSelect={selectTaxonomy}
              onCreate={handleCreateTaxonomy}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Input
              label="Source URL"
              type="url"
              value={form.source_url}
              onChange={(e) => updateField("source_url", e.target.value)}
              placeholder="https://github.com/..."
            />
            <Input
              label="License"
              value={form.license}
              onChange={(e) => updateField("license", e.target.value)}
              placeholder="CC BY-SA 4.0"
            />
            <Input
              label="Publication Date"
              type="date"
              value={form.publication_date}
              onChange={(e) => updateField("publication_date", e.target.value)}
            />
            <Input
              label="Cover Image URL"
              type="url"
              value={form.cover_url}
              onChange={(e) => updateField("cover_url", e.target.value)}
              placeholder="https://.../cover.jpg"
            />
          </div>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Chapters</h2>
              <Button type="button" variant="ghost" onClick={addChapter} className="text-sm">
                + Add chapter
              </Button>
            </div>

            <div className="space-y-4">
              {form.chapters.map((ch, index) => (
                <div
                  key={index}
                  className={`relative rounded-lg border bg-ink-50 p-4 transition-all ${
                    highlightedPreview === index
                      ? "border-accent ring-2 ring-accent/40"
                      : "border-ink-200"
                  }`}
                >
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveChapter(index, "up")}
                      className="absolute -top-2 -left-2 mr-8 text-ink-600 hover:text-ink-900"
                    >
                      ▲
                    </button>
                  )}
                  {index < form.chapters.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveChapter(index, "down")}
                      className="absolute -top-2 -right-2 mr-3 text-ink-600 hover:text-ink-900"
                    >
                      ▼
                    </button>
                  )}

                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-ink-600">Chapter {index + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => togglePreview(index)}
                        className="px-2 py-1 text-xs"
                      >
                        {previewChapter === index ? "Hide preview" : "Preview"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeChapter(index)}
                        disabled={form.chapters.length <= 1}
                        className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <Input
                    label="Chapter Title"
                    value={ch.title}
                    onChange={(e) => handleChapterTitleChange(index, e.target.value)}
                    placeholder="Falls back to the first # heading in the content"
                    className="mb-2"
                  />

                  <Input
                    label="Chapter Slug"
                    value={ch.slug}
                    onChange={(e) => updateChapter(index, "slug", e.target.value)}
                    placeholder="Auto-generated from the title"
                    className="mb-2"
                  />

                  <div className="mb-2">
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      Chapter Content (Markdown)
                    </label>
                    <textarea
                      value={ch.content}
                      onChange={(e) => updateChapter(index, "content", e.target.value)}
                      className="min-h-[200px] w-full rounded-lg border border-line bg-paper p-3 text-sm text-ink-900 focus:border-accent focus:outline-none"
                      placeholder="# Chapter Title&#10;&#10;Your content here..."
                    />
                  </div>

                  {previewChapter === index && (
                    <div
                      ref={(el) => {
                        previewRefs.current[index] = el;
                      }}
                      className="mt-4 scroll-mt-4"
                    >
                      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-600">
                        Preview — Chapter {index + 1}
                      </div>
                      <div
                        className="reader-prose rounded-lg border border-line bg-paper p-4"
                        dangerouslySetInnerHTML={renderPreview(ch.content)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-ink-600">
              {form.chapters.length} chapter{form.chapters.length !== 1 ? "s" : ""} &bull;{" "}
              {form.chapters.filter((c) => c.content.trim()).length} with content
            </p>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? "Saving..." : bookId ? "Update Book" : "Create Book"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}




