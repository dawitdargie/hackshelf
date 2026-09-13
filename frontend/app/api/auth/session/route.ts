// Next.js route handler — HttpOnly refresh-token cookie store (Phase 13).
// POST: persist the refresh token in an HttpOnly cookie after login/signup.
// GET: read the refresh token back for silent session restore.
// DELETE: clear the cookie on logout.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "hackshelf_refresh";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: Request) {
  const { refresh_token: refreshToken } = await request.json();
  if (!refreshToken) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "refresh_token is required" } },
      { status: 422 },
    );
  }
  const jar = await cookies();
  jar.set(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  const jar = await cookies();
  const refreshToken = jar.get(COOKIE_NAME)?.value ?? null;
  return NextResponse.json({ refresh_token: refreshToken });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  return new NextResponse(null, { status: 204 });
}