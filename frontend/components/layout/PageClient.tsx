"use client";

// HackShelf — client wrapper for server page components that need the auth
// context. Exposes `useLogout()` so server-rendered page sections can hand a
// stable logout callback to client sub-components (e.g. HeaderActions) without
// those sub-components importing useAuth directly.

import { useCallback } from "react";
import { useAuth } from "@/lib/auth";

/** Stable logout callback for passing as a prop across the server/client boundary. */
export function useLogout() {
  const { logout } = useAuth();
  return useCallback(logout, [logout]);
}
