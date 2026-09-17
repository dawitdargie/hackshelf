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

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;

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
    case "INVALID_CREDENTIALS":
      return { fieldErrors: {}, formError: error.message };
    case "VALIDATION_ERROR":
    case "INVALID_REQUEST":
      return { fieldErrors: {}, formError: error.message };
    default:
      return { fieldErrors: {}, formError: error.message };
  }
}