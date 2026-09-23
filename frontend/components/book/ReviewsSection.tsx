"use client";

// HackShelf — reviews section (Phase 16).
// Backend reviews have no per-review rating field — list is username,
// content, date only (frontend does not invent backend fields).
// Ownership: edit/delete only for the current user's own review.

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "@/hooks/useReviews";
import { ReviewForm } from "./ReviewForm";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReviewsSection({ bookId }: { bookId: string }) {
  const { user, status } = useAuth();
  const reviews = useReviews(bookId);
  const create = useCreateReview(bookId);
  const update = useUpdateReview(bookId);
  const remove = useDeleteReview(bookId);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = reviews.data ?? [];
  const myReview = user ? list.find((r) => r.user.id === user.id) : undefined;
  const alreadyReviewed = Boolean(myReview);

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="section-label mb-2">Community</p>
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
            Reviews <span className="text-muted">({list.length})</span>
          </h2>
        </div>
      </div>

      {/* Create — authenticated users who haven't reviewed yet */}
      {status === "authenticated" && !alreadyReviewed && (
        <div className="mb-8 max-w-2xl">
          <ReviewForm
            bookId={bookId}
            isPending={create.isPending}
            onSubmit={(content) =>
              create.mutate(content, { onSuccess: () => undefined })
            }
          />
        </div>
      )}
      {status === "unauthenticated" && (
        <p className="meta-line mb-8">
          <Link href="/login?next=/books" className="text-accent-dark underline underline-offset-2 hover:text-ink">
            Log in
          </Link>{" "}
          to write a review.
        </p>
      )}

      {reviews.isLoading && <p className="meta-line">Loading reviews…</p>}
      {reviews.isError && (
        <p className="text-sm text-rose">Couldn&apos;t load reviews.</p>
      )}

      {!reviews.isLoading && list.length === 0 && (
        <div className="paper-card px-6 py-10 text-center text-sm text-ink-3">
          No reviews yet. be the first to share your thoughts.
        </div>
      )}

      <ul className="max-w-2xl space-y-4">
        {list.map((review) => {
          const own = user?.id === review.user.id;
          const isEditing = editingId === review.id;
          return (
            <li key={review.id} className="paper-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-display text-sm font-bold text-ink">
                    {review.user.username}
                  </span>
                  <span className="meta-line ml-3">{formatDate(review.created_at)}</span>
                  {own && (
                    <span className="meta-line ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-accent-dark">
                      you
                    </span>
                  )}
                </div>
                {own && !isEditing && (
                  <div className="flex shrink-0 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingId(review.id)}
                      className="font-medium text-ink-3 underline-offset-2 hover:text-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(review.id)}
                      className="font-medium text-rose underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-4">
                  <ReviewForm
                    bookId={bookId}
                    existing={review}
                    isPending={update.isPending}
                    submitLabel="Save changes"
                    onCancel={() => setEditingId(null)}
                    onSubmit={(content) =>
                      update.mutate(
                        { reviewId: review.id, content },
                        { onSuccess: () => setEditingId(null) },
                      )
                    }
                  />
                </div>
              ) : (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-3">
                  {review.content}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}