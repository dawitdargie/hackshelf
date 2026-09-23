"use client";

import { useAuth } from "@/lib/auth";
import { useAdminBooks, useDeleteAdminBook } from "@/hooks/useAdmin";
import Link from "next/link";
import { useState } from "react";

interface AdminBook {
  id: string;
  slug: string;
  title: string;
  level: string;
  chapter_count: number;
  created_at: string;
  updated_at: string;
  authors: string[];
  categories: string[];
  topics: string[];
}

export function AdminClient() {
  const { user, status } = useAuth();
  const { data: books, error } = useAdminBooks();
  const deleteMutation = useDeleteAdminBook();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-ink">Loading...</h1>
        </div>
      </div>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm">
        <div className="max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold text-ink mb-4">Authentication Required</h1>
          <p className="text-ink/70 mb-6">
            You need to be logged in to access the admin panel.
          </p>
          <Link
            href="/login"
            className="inline-block bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm">
        <div className="max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold text-ink mb-4">Access Denied</h1>
          <p className="text-ink/70 mb-6">
            You don&apos;t have permission to access the admin panel. Only administrators can manage the book catalog.
          </p>
          <Link
            href="/"
            className="inline-block bg-ink hover:bg-ink-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm">
        <div className="max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold text-ink mb-4">Error Loading Books</h1>
          <p className="text-ink/70 mb-6">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Admin Panel</h1>
            <p className="text-ink/70 mt-1">Manage books and taxonomy</p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add New Book
          </button>
        </div>

        {showNewForm && <NewBookForm onClose={() => setShowNewForm(false)} />}

        {books?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ink/70">No books added yet. Click &quot;Add New Book&quot; to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {books?.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isDeleting={deletingId === book.id}
                onDelete={() => {
                  if (window.confirm(`Delete "${book.title}"? This cannot be undone.`)) {
                    setDeletingId(book.id);
                    deleteMutation.mutate(book.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Book card
// ---------------------------------------------------------------------------

function BookCard({ book, isDeleting, onDelete }: {
  book: AdminBook;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-line-2 bg-paper shadow-sm transition-shadow hover:shadow-md">
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper/80">
          <div className="text-ink/70">Deleting...</div>
        </div>
      )}

      <div className="flex-1 p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-ink">
            <Link href={`/read/${book.slug}`} className="hover:text-accent">
              {book.title}
            </Link>
          </h3>
          <div className="flex gap-1 shrink-0">
            <Link
              href={`/admin/books/${book.id}`}
              className="rounded bg-ink/5 p-1.5 text-ink/60 hover:bg-ink/10 hover:text-ink transition-colors"
              aria-label="Edit book"
              title="Edit book"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M11.3 1.9a1.6 1.6 0 012.3 0l.5.5a1.6 1.6 0 010 2.3L6 12.8l-3.5.9.9-3.5 7.9-8.3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <button
              onClick={onDelete}
              className="rounded bg-rose/10 p-1.5 text-rose hover:bg-rose/20 transition-colors disabled:opacity-50"
              disabled={isDeleting}
              aria-label="Delete book"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M12 4v9.5a1 1 0 01-1 1H5a1 1 0 01-1-1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-sm text-ink/60 mb-3">
          {book.slug}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {book.level && (
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-dark">
              {book.level}
            </span>
          )}
          <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-medium text-ink/70">
            {book.chapter_count} chapters
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {book.categories.slice(0, 2).map((cat) => (
            <span key={cat} className="rounded bg-ink/5 px-2 py-0.5 text-[11px] text-ink/60">
              {cat}
            </span>
          ))}
          {book.categories.length > 2 && (
            <span className="rounded bg-ink/5 px-2 py-0.5 text-[11px] text-ink/60">
              +{book.categories.length - 2}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-ink/50">
          <span>Updated {new Date(book.updated_at).toLocaleDateString()}</span>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/books/${book.id}`}
              className="text-accent hover:underline"
            >
              Edit
            </Link>
            <Link
              href={`/read/${book.slug}`}
              className="text-accent hover:underline"
            >
              View in reader
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New book form
// ---------------------------------------------------------------------------

function NewBookForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [chapters, setChapters] = useState<{ slug: string; title: string; content: string }[]>([
    { slug: "", title: "", content: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleSlug = slug || slugify(title);

  function handleAddChapter() {
    setChapters([...chapters, { slug: "", title: "", content: "" }]);
  }

  function handleRemoveChapter(index: number) {
    if (chapters.length > 1) {
      setChapters(chapters.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/v1/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: titleSlug,
          description: description || title,
          level,
          authors: [],
          categories: [],
          topics: [],
          chapters,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to create book");
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl bg-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-line-2 p-4">
          <h2 className="text-xl font-bold text-ink">Add New Book</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-rose/10 p-3 text-sm text-rose">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-ink mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug || slug === slugify(title)) {
                  setSlug(slugify(e.target.value));
                }
              }}
              className="w-full rounded-lg border border-line-2 px-4 py-2.5 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Enter book title"
              required
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-ink mb-1">
              Slug (auto-generated)
            </label>
            <input
              id="slug"
              type="text"
              value={titleSlug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-line-2 px-4 py-2.5 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
              placeholder="auto-generated-from-title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-lg border border-line-2 px-4 py-2.5 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Brief description of the book (optional - defaults to title)"
            />
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-ink mb-1">
              Level *
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-lg border border-line-2 px-4 py-2.5 text-ink bg-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              required
            >
              <option value="">Select level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Chapters *
            </label>
            <div className="space-y-3">
              {chapters.map((chapter, index) => (
                <div key={index} className="flex flex-col gap-2 p-3 rounded-lg border border-line-2 bg-warm/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink/60">Chapter {index + 1}</span>
                    {chapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChapter(index)}
                        className="text-rose text-xs hover:text-rose-dark"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-ink/70 mb-1">Slug</label>
                      <input
                        type="text"
                        value={chapter.slug}
                        onChange={(e) => {
                          const newChapters = [...chapters];
                          newChapters[index] = { ...newChapters[index], slug: e.target.value };
                          setChapters(newChapters);
                        }}
                        className="w-full rounded border border-line-2 px-2 py-1.5 text-ink text-xs font-mono focus:border-accent focus:outline-none"
                        placeholder="auto-generated"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink/70 mb-1">Title</label>
                      <input
                        type="text"
                        value={chapter.title}
                        onChange={(e) => {
                          const newChapters = [...chapters];
                          newChapters[index] = { ...newChapters[index], title: e.target.value };
                          setChapters(newChapters);
                        }}
                        className="w-full rounded border border-line-2 px-2 py-1.5 text-ink text-xs focus:border-accent focus:outline-none"
                        placeholder="Chapter title"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ink/70 mb-1">Content (Markdown)</label>
                    <textarea
                      value={chapter.content}
                      onChange={(e) => {
                        const newChapters = [...chapters];
                        newChapters[index] = { ...newChapters[index], content: e.target.value };
                        setChapters(newChapters);
                      }}
                      className="w-full min-h-[120px] rounded border border-line-2 px-2 py-1.5 text-ink text-xs focus:border-accent focus:outline-none"
                      placeholder="Enter chapter content in Markdown..."
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddChapter}
              className="mt-2 w-full rounded-lg border-2 border-dashed border-line-2 px-4 py-2 text-sm text-ink/60 hover:border-accent hover:text-accent transition-colors"
            >
              + Add Chapter
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-line-2 px-4 py-2.5 text-ink font-medium hover:bg-ink/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || chapters.some((c) => !c.content)}
              className="flex-1 rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
