"use client";

// HackShelf — profile page body (Phase 19). Protected: redirects
// unauthenticated visitors to /login?next=/profile. Logout revokes the
// refresh token server-side, clears the cookie, and returns to the homepage.

import { useRouter } from "next/navigation";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { useBookmarks, useLibrary } from "@/hooks/useLibrary";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { ActivitySummary } from "@/components/profile/ActivitySummary";
import { LoadingState } from "@/components/ui/LoadingState";

export default function ProfileClient() {
  useRequireAuth("/profile");
  const { logout } = useAuth();
  const router = useRouter();
  const library = useLibrary();
  const bookmarks = useBookmarks();

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  if (library.isLoading || bookmarks.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10">
        <LoadingState rows={2} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6">
        <p className="section-label mb-2">Your account</p>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink md:text-3xl">
          Profile
        </h1>
      </div>

      <div className="space-y-4">
        <ProfileInfo />

        <div className="paper-card p-6">
          <div className="section-label mb-4">Activity</div>
          <ActivitySummary library={library.data} bookmarks={bookmarks.data} />
        </div>

        <div className="paper-card p-6">
          <div className="section-label mb-4">Session</div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-rose/30 bg-rose-soft px-5 py-2.5 text-sm font-semibold text-rose transition-colors hover:bg-rose/10"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}