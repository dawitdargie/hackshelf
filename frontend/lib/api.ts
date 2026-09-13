// HackShelf — typed API client (Phase 13).
// Wraps fetch against the Go backend's /api/v1 REST contract, handling the
// `{ data }` success envelope, the `{ error: { code, message } }` error
// envelope, Bearer-token attach, and single-flight access-token refresh.

import type { ApiErrorBody } from "@/types";

export const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1`;

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

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  auth?: boolean;
  /** Skip the automatic refresh-and-retry on 401 (used by the refresher itself). */
  skipRetry?: boolean;
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
  const { auth = false, skipRetry = false, body, params } = options;

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
  getAuthed: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>("GET", path, { auth: true, params }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  postAuthed: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, { auth: true, body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  putAuthed: <T>(path: string, body?: unknown) => request<T>("PUT", path, { auth: true, body }),
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

/** Single-flight: concurrent 401s share one refresh + retry cycle. */
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
        throw new ApiError(401, "UNAUTHENTICATED", "Session expired");
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}