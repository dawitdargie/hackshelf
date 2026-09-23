// HackShelf — auth form validators (Phase 18).
// Mirrors backend validation exactly (users.UserService.ValidateSignup):
// username 3–50 chars matching ^[a-zA-Z0-9_]+$, email per backend regex,
// password minimum 8 characters (backend enforces no complexity rules).

import { z } from "zod";
import { ApiError } from "@/lib/api";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(EMAIL_REGEX, "Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be 3-50 characters")
    .max(50, "Username must be 3-50 characters")
    .regex(USERNAME_REGEX, "Username can only contain letters, numbers, and underscores"),
  email: z
    .string()
    .min(1, "Email is required")
    .regex(EMAIL_REGEX, "Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(EMAIL_REGEX, "Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/**
 * Only same-origin relative paths are allowed for `?next=` redirects, so a
 * crafted link such as /login?next=https://evil.example cannot bounce a freshly
 * authenticated user off-site. Anything absolute, protocol-relative (`//host`),
 * backslash-based, or carrying a scheme is discarded in favour of `fallback`.
 */
export function sanitizeNextPath(
  raw: string | null | undefined,
  fallback = "/library",
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("\\") || raw.includes(":")) return fallback;
  return raw;
}

export type FieldErrors = Partial<Record<"username" | "email" | "password", string>>;

/** Map a backend ApiError to per-field errors + an optional form-level message. */
export function apiErrorToFieldErrors(
  error: unknown,
): { fieldErrors: FieldErrors; formError?: string } {
  if (!(error instanceof ApiError)) {
    return { fieldErrors: {}, formError: "Could not reach the server" };
  }

  switch (error.code) {
    case "EMAIL_TAKEN":
      return { fieldErrors: { email: error.message } };
    case "USERNAME_TAKEN":
      return { fieldErrors: { username: error.message } };
    case "RATE_LIMITED":
      return {
        fieldErrors: {},
        formError:
          "Too many attempts. Please wait about a minute before trying again.",
      };
    case "INVALID_CREDENTIALS":
      return { fieldErrors: {}, formError: error.message };
    case "VALIDATION_ERROR":
    case "INVALID_REQUEST":
      return { fieldErrors: {}, formError: error.message };
    default:
      return { fieldErrors: {}, formError: error.message };
  }
}
/**
 * Slugify a string: lowercase, remove non-word chars, replace spaces with hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
