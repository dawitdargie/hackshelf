// HackShelf — typed API client (Phase 13).
// Wraps fetch against the Go backend's /api/v1 REST contract, handling the
// `{ data }` success envelope, the `{ error: { code, message } }` error
// envelope, Bearer-token attach, and single-flight access-token refresh.

import type { ApiErrorBody, Paginated } from "@/types";

// The browser and the Next.js server reach the API at different addresses:
// server-side rendering runs inside the frontend container, where "localhost"
// is the container itself rather than the API. API_URL_INTERNAL is a
// server-only variable (no NEXT_PUBLIC_ prefix) so it is read from the runtime
// environment, while the public URL is inlined at build time for the browser.
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const SERVER_API_URL = process.env.API_URL_INTERNAL || PUBLIC_API_URL;

export { PUBLIC_API_URL };

export const API_BASE_URL = `${typeof window === "undefined" ? SERVER_API_URL : PUBLIC_API_URL}/api/v1`;

/** Structured API error mirroring the backend's error envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isConflict() {
    return this.status === 409;
  }

  get isValidation() {
    return this.status === 422;
  }
}

// ---------------------------------------------------------------------------
// Token store — access token lives in memory only (never localStorage).
// The refresh token is persisted as an HttpOnly cookie via the Next.js
// route handler at /api/auth/session (see lib/auth.ts).
// ---------------------------------------------------------------------------

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// ---------------------------------------------------------------------------
// Refresh plumbing
// ---------------------------------------------------------------------------

type Refresher = (
  refreshToken: string,
) => Promise<{ access_token: string; refresh_token: string }>;
let refreshImpl: Refresher | null = null;
let refreshPromise: Promise<void> | null = null;

/** Registers the refresh implementation (called by lib/auth.ts to avoid a cycle). */
export function registerTokenRefresher(impl: Refresher) {
  refreshImpl = impl;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  auth?: boolean;
  /** Skip the automatic refresh-and-retry on 401 (used by the refresher itself). */
  skipRetry?: boolean;
  /**
   * Return the whole `{ data, meta }` envelope instead of unwrapping `data`.
   * Paginated list endpoints carry their pagination metadata as a sibling of
   * `data`, so unwrapping would silently discard it.
   */
  envelope?: boolean;
}

function buildURL(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function request<T>(
  method: Method,
  path: string,
  options: RequestOptions & {
    body?: unknown;
    params?: Record<string, string | number | undefined>;
  } = {},
): Promise<T> {
  const { auth = false, skipRetry = false, envelope = false, body, params } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(buildURL(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server");
  }

  // 204 No Content — nothing to parse.
  if (res.status === 204) return undefined as T;

  const json = res.headers.get("content-type")?.includes("application/json")
    ? await res.json()
    : null;

  if (!res.ok) {
    const errBody = json as ApiErrorBody | null;
    const status = res.status;

    // Access token expired → refresh once (single-flight) and retry the request.
    if (status === 401 && auth && !skipRetry) {
      try {
        await refreshAccessToken();
      } catch (refreshError) {
        throw refreshError;
      }
      return request<T>(method, path, { ...options, skipRetry: true });
    }

    throw new ApiError(
      status,
      errBody?.error?.code ?? "UNKNOWN_ERROR",
      errBody?.error?.message ?? "Something went wrong",
    );
  }

  // Paginated endpoints keep their envelope so `meta` survives.
  if (envelope) return json as T;

  // Unwrap the `{ data }` envelope when present.
  return (json && typeof json === "object" && "data" in json
    ? (json as { data: T }).data
    : json) as T;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>("GET", path, { params }),
  /** Paginated GET: returns the full `{ data, meta }` envelope. */
  getPaged: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<Paginated<T>>("GET", path, { params, envelope: true }),
  getAuthed: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>("GET", path, { auth: true, params }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  postAuthed: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, { auth: true, body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  putAuthed: <T>(path: string, body?: unknown) => request<T>("PUT", path, { auth: true, body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  patchAuthed: <T>(path: string, body?: unknown) =>
    request<T>("PATCH", path, { auth: true, body }),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, { body }),
  deleteAuthed: <T>(path: string, body?: unknown) =>
    request<T>("DELETE", path, { auth: true, body }),
  /** Raw request without refresh/retry — used by the auth flows themselves. */
  rawPost: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, { body, skipRetry: true }),
  rawPut: <T>(path: string, body?: unknown) =>
    request<T>("PUT", path, { body, skipRetry: true }),
};

async function readSessionCookie(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const res = await fetch("/api/auth/session", { method: "GET" });
  if (!res.ok) return null;
  const body = (await res.json()) as { refresh_token?: string | null };
  return body.refresh_token ?? null;
}

/** Drop the HttpOnly refresh cookie (best-effort — used on logout/failed refresh). */
export async function clearSessionCookie(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    // Clearing the cookie is best-effort; local state is cleared regardless.
  }
}

/**
 * Single-flight: concurrent 401s share one refresh + retry cycle.
 *
 * The backend revokes (rotates) the presented refresh token, so the response
 * carries a brand new one. That rotated token is handed to the registered
 * refresher, which persists it back into the HttpOnly cookie — without that
 * write-back the cookie would keep a dead token and the next page load would
 * end the session.
 */
export async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await readSessionCookie();
      if (!refreshToken || !refreshImpl) {
        setAccessToken(null);
        throw new ApiError(401, "UNAUTHENTICATED", "Session expired");
      }
      try {
        const tokens = await refreshImpl(refreshToken);
        setAccessToken(tokens.access_token);
      } catch {
        setAccessToken(null);
        // The cookie can no longer be refreshed — remove it so the app stops
        // retrying a dead token on every page load.
        await clearSessionCookie();
        throw new ApiError(401, "UNAUTHENTICATED", "Session expired");
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
// --- Admin API endpoints ---

export const admin = {
  getBooks: <T>() =>
    request<T>("GET", "/admin/books", { auth: true }),
  getBook: <T>(bookId: string) =>
    request<T>("GET", `/admin/books/${encodeURIComponent(bookId)}`, { auth: true }),
  createBook: <T>(body: unknown) =>
    request<T>("POST", "/admin/books", { auth: true, body }),
  updateBook: <T>(bookId: string, body: unknown) =>
    request<T>("PUT", `/admin/books/${encodeURIComponent(bookId)}`, { auth: true, body }),
  deleteBook: <T>(bookId: string) =>
    request<T>("DELETE", `/admin/books/${encodeURIComponent(bookId)}`, { auth: true }),
  createCategory: <T>(name: string) =>
    request<T>("POST", "/admin/categories", { auth: true, body: { name } }),
  createTopic: <T>(name: string) =>
    request<T>("POST", "/admin/topics", { auth: true, body: { name } }),
  createAuthor: <T>(name: string) =>
    request<T>("POST", "/admin/authors", { auth: true, body: { name } }),
};
