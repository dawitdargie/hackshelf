# HackShelf — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS frontend for HackShelf.

## Data layer (Phase 13)

- `types/index.ts` — types mirroring the backend's Go structs exactly.
- `lib/api.ts` — typed fetch client for `/api/v1`: unwraps `{ data }`, parses
  `{ error: { code, message } }` into `ApiError`, attaches `Bearer` tokens, and
  performs a single-flight refresh-and-retry on 401.
- `lib/auth.tsx` — `AuthProvider` + `useAuth` (`{ user, status, login, signup, logout }`).
  Access token lives in memory only; the refresh token is stored in an HttpOnly
  cookie served by `app/api/auth/session/route.ts`. `useRequireAuth` redirects
  unauthenticated users to `/login?next=…`.
- `hooks/` — TanStack Query hooks for every endpoint: `useBooks`, `useBook`,
  `useChapters`, `useTaxonomy` (levels/categories/topics/authors), `useReviews`
  (+ rating mutations), `useLibrary` (saved books, bookmarks, progress), `useAuth`.
- `app/providers.tsx` — mounts `QueryClientProvider` + `AuthProvider`.

Public pages render without auth; library/bookmark/progress queries stay
disabled until `status === "authenticated"`.

## Design system

Light "paper/editorial" theme matching `hack design/index.html`: tokens in
`tailwind.config.ts`, fonts via `next/font` (Syne / Inter / JetBrains Mono) in
`app/layout.tsx`, base styles in `app/globals.css`, components in `components/ui`.

## Structure

```
frontend/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
├── hooks/         # TanStack Query hooks
├── lib/           # API client, auth, utilities
├── types/         # TypeScript types
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
└── .env.example
```

## Development

Run the frontend with Docker Compose:

```
docker compose up frontend
```

Or run locally with Next.js:

```
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev
```
