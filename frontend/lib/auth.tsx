"use client";

// HackShelf — authentication state management (Phase 13).
// Access token lives in memory (via lib/api.ts). The refresh token is stored
// only in an HttpOnly cookie managed by /api/auth/session. useAuth exposes
// { user, status, login, signup, logout } and boot restores the session by
// silently refreshing.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  clearSessionCookie,
  refreshAccessToken,
  registerTokenRefresher,
  setAccessToken,
} from "@/lib/api";
import { sanitizeNextPath } from "@/lib/validators";
import type {
  AuthResponse,
  RefreshResponse,
  User,
} from "@/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  signup: (username: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** Refresh the in-memory user after a profile edit (PATCH /me). */
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Store the fresh refresh token in the HttpOnly cookie session. */
async function persistRefreshToken(refreshToken: string) {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

// Register the refresh implementation with the API client (avoids an import
// cycle: lib/auth imports lib/api, never the other way around).
//
// The backend rotates the refresh token on every use and revokes the old one,
// so the rotated token must be written back into the HttpOnly cookie straight
// away. Without this write-back the cookie keeps a dead token and the next
// boot refresh fails, silently logging the user out on reload.
registerTokenRefresher(async (refreshToken) => {
  const tokens = await api.rawPost<RefreshResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  await persistRefreshToken(tokens.refresh_token);
  return tokens;
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Boot: restore the session from the HttpOnly refresh cookie if present.
  // Uses the client's single-flight refresher so there is exactly one code
  // path that rotates + persists refresh tokens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshAccessToken();
        const me = await api.getAuthed<User>("/me");
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyAuthResponse = useCallback(async (res: AuthResponse) => {
    setAccessToken(res.access_token);
    await persistRefreshToken(res.refresh_token);
    setUser(res.user);
    setStatus("authenticated");
    return res.user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) =>
      applyAuthResponse(
        await api.rawPost<AuthResponse>("/auth/login", { email, password }),
      ),
    [applyAuthResponse],
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) =>
      applyAuthResponse(
        await api.rawPost<AuthResponse>("/auth/signup", {
          username,
          email,
          password,
        }),
      ),
    [applyAuthResponse],
  );

  const logout = useCallback(async () => {
    const refreshToken = await readRefreshToken();
    try {
      if (refreshToken) {
        // Logout requires the access token; best-effort — clear locally regardless.
        await api.postAuthed<void>("/auth/logout", { refresh_token: refreshToken });
      }
    } catch {
      // token already expired/revoked — proceed with local logout
    }
    setAccessToken(null);
    await clearSessionCookie();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const updateUser = useCallback((u: User) => setUser(u), []);

  const value = useMemo(
    () => ({ user, status, login, signup, logout, updateUser }),
    [user, status, login, signup, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/** Read the refresh token from the HttpOnly session cookie (browser only). */
async function readRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const res = await fetch("/api/auth/session", { method: "GET" });
  if (!res.ok) return null;
  const body = (await res.json()) as { refresh_token?: string | null };
  return body.refresh_token ?? null;
}

/**
 * Protected-route helper: call in a client component to redirect
 * unauthenticated users to /login, returning to `next` afterwards.
 */
export function useRequireAuth(nextPath = "/library") {
  const { status } = useAuth();
  const target = sanitizeNextPath(nextPath);
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.assign(`/login?next=${encodeURIComponent(target)}`);
    }
  }, [status, target]);
  return { ready: status === "authenticated", status };
}