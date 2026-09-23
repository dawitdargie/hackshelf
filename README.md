# HackShelf

A curated, free online bookstore for hackers, penetration testers and application security engineers.

HackShelf catalogs only books that may legally be redistributed and hosts their full content in the system, so every book in the catalog can be read from first page to last inside the app. No trials, no paywalls, no external "read here" links.

## What you can do with HackShelf

### Read complete books in the browser

- Every cataloged book is fully hosted: chapters are written in Markdown and render as clean, reader-friendly pages
- A table of contents plus previous/next controls move you through a book
- A reading progress bar tracks how far you are and picks up where you left off
- Bookmark any spot in a chapter and find all your bookmarks in a side panel
- Search inside the reader to locate text in the book you are reading

### Discover the right book

- Full-text and fuzzy search across titles, descriptions and authors
- Filter by skill level (Beginner, Intermediate, Advanced), category, topic and minimum rating
- Sort by newest, highest rated, or most rated
- Browse by level, category, topic or author from the catalog pages
- The home page surfaces levels, categories, your continue-reading shelf and saved books

### Keep a personal library

- Create a free account (username, email, password)
- Save books to your library for later
- Continue reading exactly where you stopped, on any device, because progress is stored server-side
- Edit your profile from the profile page

### Rate and review

- Rate books from 1 to 5 stars
- Write a review, edit it, or delete it
- See average ratings and other readers' reviews on every book page

### Manage the catalog as an admin

- A role-gated admin panel at `/admin` (only visible and usable by admin accounts)
- List all books with level, chapter count and quick actions
- Create books with a full editor: title, slug, description, level, authors, categories, topics, cover image URL, source URL, license and publication date
- Reuse or create authors, categories and topics inline while editing
- Add, edit, reorder and remove chapters, with a live Markdown preview per chapter that scrolls into view when opened
- Edit any existing book later; the reader reflects changes immediately
- Delete a book and all of its chapters, bookmarks and progress in one step

## Quick start (Docker)

```bash
docker compose up -d --build
```

This starts PostgreSQL, the API on port 8080 and the frontend on port 3000.

Then prepare the database from the host (the API image intentionally contains only the server binary):

```bash
cd backend
go run ./cmd/migrate   # applies SQL migrations in filename order
go run ./cmd/seed      # loads the OWASP starter catalog (idempotent)
```

Seeder flags: `-dry-run` validates without writing, `-dev` seeds a small subset, `-reset` clears catalog content and re-seeds.

Open <http://localhost:3000>, sign up, and you are reading.

## Using the admin panel

The admin panel is role-gated. There is no UI for promotion, so an admin account is created directly in the database:

```bash
# 1. Sign up in the app at /signup (this creates a user with role "user")

# 2. Promote yourself
docker compose exec postgres psql -U hackshelf -d hackshelf -c \
  "UPDATE users SET role = 'admin' WHERE username = 'your_username';"

# 3. Log back in (or refresh the page) and open /admin
```

Once logged in as an admin you will see an Admin link in the header. From `/admin` you can:

- **Create a book**: click "New Book", fill in the metadata, pick a level from the dropdown, toggle or create authors, categories and topics, then add chapters. Chapter titles fall back to the first `#` heading in the content, and slugs auto-derive from titles.
- **Preview a chapter**: the Preview button on a chapter card renders the Markdown exactly like the reader does, scrolls the preview into view, and highlights the card briefly.
- **Edit a book**: use the pencil icon or the Edit link on any book card. The form loads the stored book with all chapters and taxonomy selections.
- **Delete a book**: the trash icon asks for confirmation, then removes the book, its chapters, bookmarks, progress, ratings and reviews.

The role is checked on every admin API request, so promoting or demoting a user takes effect immediately, without re-issuing tokens.

## Manual development setup

If you prefer running services outside Docker (only PostgreSQL in Docker):

### 1. Environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

The defaults already match the PostgreSQL credentials in `docker-compose.yml`, so no edits are needed for local development. Both `.env` files are gitignored.

The backend loads `backend/.env` automatically; variables already present in the process environment always take precedence, so containers and production are unaffected.

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 3. Apply migrations

Run from the `backend/` directory, since the migrations path is relative:

```bash
cd backend
go run ./cmd/migrate
```

Re-running is safe: already-applied migrations print `SKIP`.

### 4. Seed the catalog

Optional but recommended, so the UI has real content to display:

```bash
cd backend
go run ./cmd/seed
```

### 5. Run the API

```bash
cd backend
go run ./cmd/api
```

Verify: <http://localhost:8080/health> returns `{"status":"ok"}`.

### 6. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deployment

The stack deploys to three free services and updates automatically on every push to `main`:

| Piece | Service | Notes |
|---|---|---|
| Frontend | Vercel (Hobby) | Auto-deploys on push, always live |
| Backend API | Render (free web service, Docker) | Auto-deploys on push; a free uptime pinger keeps it warm |
| Database | Neon (free PostgreSQL) | 0.5 GB free, wakes automatically when a request arrives |

### 1. Database: Neon

Create a project at [neon.com](https://neon.com) (no credit card) and copy the **pooled** connection string (it contains `-pooler` and `?sslmode=require`). Load the schema and seed data from your machine; environment variables override `backend/.env`:

```bash
cd backend
DATABASE_URL="neon-pooled-url" go run ./cmd/migrate
DATABASE_URL="neon-pooled-url" go run ./cmd/seed
```

### 2. Backend: Render

Either use the dashboard (New, Web Service, connect the repo, root directory `backend`, runtime Docker, free instance, health check path `/health`) or use the repository Blueprint: New, Blueprint, pick the repo. `render.yaml` at the repo root pre-fills the service.

Set these environment variables in the Render dashboard:

- `DATABASE_URL`: the Neon pooled connection string
- `FRONTEND_URL`: the exact Vercel URL (the CORS middleware matches the Origin header against this single value, no trailing slash)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: generated automatically by the Blueprint, or `openssl rand -hex 32`
- `TRUST_PROXY`: `1` (rate limiting then uses real client IPs behind Render's proxy)

`render.yaml` also configures the pre-deploy command `migrate`, which applies pending SQL migrations before each new release goes live. The migrations ship inside the Docker image for this purpose. If pre-deploy commands are unavailable on the free plan, run the migrate command from your machine as shown above.

### 3. Frontend: Vercel

Import the repository at [vercel.com](https://vercel.com), set the root directory to `frontend`, and add these environment variables **before** the first build (`NEXT_PUBLIC_API_URL` is inlined at build time):

- `NEXT_PUBLIC_API_URL`: the Render URL, for example `https://hackshelf-api.onrender.com`
- `API_URL_INTERNAL`: the same URL (used by server-side rendering)

### 4. Keep the backend warm

Render free instances sleep after about 15 minutes without traffic and take up to a minute to wake. Add a free monitor at [uptimerobot.com](https://uptimerobot.com) that requests `https://<render-url>/health` every 5 minutes; the API then behaves as always-live.

### 5. Admin on production

Promotion is the same as locally, against Neon:

```bash
psql "neon-pooled-url" -c "UPDATE users SET role = 'admin' WHERE username = 'your_username';"
```

Then log out and back in so the frontend refetches the profile with the new role.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query |
| Backend | Go 1.25, standard-library router, pgx |
| Database | PostgreSQL 16 (full-text and trigram search) |
| Tooling | Docker Compose, ESLint, Zod |

## Repository layout

```
backend/            Go API, migrations, seeder
  cmd/api/          HTTP server entrypoint
  cmd/migrate/      Migration runner
  cmd/seed/         Catalog seeder
  migrations/       SQL migrations (applied in filename order)
  internal/         auth, admin, books, taxonomy, library, middleware
frontend/           Next.js app (App Router)
  app/              routes (public catalog, reader, auth, library, profile, admin)
  components/       UI, catalog, book, reader, library, profile, auth, admin
  hooks/            TanStack Query hooks
  lib/              API client, auth, queries, validators, admin helpers
docs/               Project documentation (requirements to implementation plan)
```

## Checks

```bash
cd backend  && go build ./... && go vet ./... && go test ./... && gofmt -l .
cd frontend && npm run build && npx eslint app components hooks lib --ext .ts,.tsx
```

## Documentation

| Doc | Contents |
|---|---|
| `docs/01-PROJECT.md` | Vision and scope |
| `docs/02-REQUIREMENTS.md` | Functional requirements |
| `docs/03-ARCHITECTURE.md` | System architecture |
| `docs/04-DATABASE.md` | Schema |
| `docs/05-API.md` | API contract |
| `docs/06-FRONTEND.md` | Frontend requirements |
| `docs/07-SECURITY.md` | Security policy |
| `docs/08-DEPLOYMENT.md` | Deployment plan |
| `docs/09-USER_FLOW.md` | User flows |
| `docs/10-IMPLEMENTATION_PLAN.md` | Phased implementation plan |

## Troubleshooting

- **`DATABASE_URL environment variable is required`**: `backend/.env` is missing or the command was run from the wrong directory.
- **`Failed to connect to database`**: PostgreSQL is not up yet (`docker compose up -d postgres`), or port 5432 is taken by another instance.
- **Migrations do nothing**: make sure you are inside `backend/`, since `migrations/` is resolved relative to the working directory.
- **`lookup registry-1.docker.io: no such host` during `docker compose build`**: your machine cannot reach Docker Hub. Check general internet access, disconnect or configure your VPN proxy in Docker Desktop (Settings, Resources, Proxies), or restart Docker Desktop (`wsl --shutdown` also helps on Windows). The stack code is fine; this is a machine network issue.
- **Admin link does not appear after promoting yourself**: log out and back in, or refresh, so the frontend refetches your profile with the new role.

