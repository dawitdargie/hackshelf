"use client";

// HackShelf — profile edit form. Lets the user edit their display name.
// Email and username are read-only by design; no bio (not social media).

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/types";

const MAX_NAME = 50;

export function ProfileEditForm() {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooLong = displayName.length > MAX_NAME;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving || tooLong) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await api.patchAuthed<User>("/me", {
        display_name: displayName.trim(),
      });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none";

  return (
    <div className="paper-card p-6">
      <div className="section-label mb-4">Edit profile</div>

      <form onSubmit={onSave} className="space-y-4">
        {/* Display name */}
        <div>
          <label htmlFor="display_name" className="mb-1 block text-sm font-medium text-ink">
            Display name
          </label>
          <input
            id="display_name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should we show your name?"
            className={inputClass}
            maxLength={MAX_NAME + 10}
          />
          <p className="meta-line mt-1">
            {displayName.length}/{MAX_NAME}
          </p>
        </div>

        {/* Email — read-only notice */}
        <p className="meta-line">Email cannot be changed here.</p>

        {error && <p className="text-sm font-medium text-rose">{error}</p>}
        {saved && <p className="text-sm font-medium text-teal">Saved.</p>}

        <button
          type="submit"
          disabled={saving || tooLong}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
