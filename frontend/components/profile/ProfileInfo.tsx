"use client";

// HackShelf — profile info card (Phase 19). User data comes from the auth
// context (GET /me on session restore).

import { useAuth } from "@/lib/auth";

export function ProfileInfo() {
  const { user } = useAuth();

  return (
    <div className="paper-card flex items-center gap-4 p-6">
      <span
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink font-display text-xl font-bold text-lime"
        aria-hidden
      >
        {(user?.username ?? "?").charAt(0).toUpperCase()}
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-ink">
          {user?.username ?? "…"}
        </h2>
        <p className="meta-line truncate">{user?.email ?? "…"}</p>
        {user?.created_at && (
          <p className="meta-line mt-1">
            Member since{" "}
            <strong>
              {new Date(user.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
              })}
            </strong>
          </p>
        )}
      </div>
    </div>
  );
}