# HackShelf — Implementation Plan

## 1. Purpose
This document defines the phased implementation plan for HackShelf.
Each **phase** contains exactly **one milestone**, and each milestone is **one single, focused task**.
We implement one milestone at a time. Each milestone must be verified before moving to the next.

---

## 2. Implementation Principles

- **One phase = one milestone = one task.**
- Each milestone is small enough to implement accurately in one session.
- Each milestone builds on the previous one (no forward dependencies).
- The backend is fully complete before frontend development begins (the API is the contract).
- Seed data is added after all features work, so the catalog can be tested with real data.
- The project remains 100% free and within the documented scope.

---

## 3. Technology Decisions (Implementation Adjustments)

These adjustments change only the implementation approach, not the project scope:

| Area | Decision |
| --- | --- |
| Go HTTP | Standard library HTTP server with a minimal router (no heavy framework) |
| Migrations | Plain SQL migration files with a simple Go migration runner |
| Password reset | Signed JWT reset token (no email service for MVP; pluggable email interface) |
| Search | PostgreSQL `tsvector`/`tsquery` full-text search with `ILIKE` fallback |
| Frontend rendering | SSR for public catalog pages (SEO), client-side for authenticated pages |
| Reader content | Chapter-based Markdown/HTML hosted IN-SYSTEM for every cataloged book. No external reading links: if a book is listed, the full book is readable inside HackShelf. Catalog inclusion requires redistribution rights (open-source/CC/public-domain license OR written author permission). Books pending permission are tracked in a wishlist and excluded from the catalog until approved. |

---

## 4. Phase Overview

| Phase | Milestone | Task |
| --- | --- | --- |
| 1 | 1 | Create project foundation (structure, Docker Compose, env files) |
| 2 | 2 | Create PostgreSQL migrations for all 15 tables |
| 3 | 3 | Set up Go backend skeleton (layers, DB pool, health endpoint) |
| 4 | 4 | Implement backend middleware (errors, CORS, logging, rate limiting) |
| 5 | 5 | Implement auth signup & login (Argon2id, JWT, refresh tokens) |
| 6 | 6 | Implement token management & password reset |
| 7 | 7 | Implement books API (list + details) |
| 8 | 8 | Implement search, filter & sort API |
| 9 | 9 | Implement taxonomy API (levels, categories, topics, authors) |
| 10 | 10 | Implement ratings & reviews API |
| 11 | 11 | Implement library API (saved, bookmarks, progress, me) |
| 12 | 12 | Set up frontend foundation (Next.js, Tailwind, design system, layout) |
| 13 | 13 | Create frontend data layer (API client, types, hooks, auth state) |
| 14 | 14 | Build homepage |
| 15 | 15 | Build books listing page (search, filter, sort, pagination) |
| 16 | 16 | Build book details page |
| 17 | 17 | Build taxonomy & author pages |
| 18 | 18 | Build auth pages (login, signup) |
| 19 | 19 | Build library & profile pages |
| 20 | 20 | Build online reader |
| 21 | 21 | Create seed data (~100 books) |
| 22 | 22 | Deploy to production & final polish |

---

## 5. Detailed Phases

---

### Phase 1 — Project Foundation
**Milestone 1:** Create root project structure, Docker Compose, and environment configuration.

#### Tasks
1. Create root directory structure:
   ```
   hackshelf/
   ├── frontend/
   ├── backend/
   ├── docs/
   └── docker-compose.yml
   ```
2. Create `docker-compose.yml` with three services:
   - `frontend` → Next.js on port 3000
   - `backend` → Go API on port 8080
   - `postgres` → PostgreSQL on port 5432
3. Create `.env.example` files:
   - Root `.env.example`
   - `backend/.env.example`
   - `frontend/.env.example`
4. Update `.gitignore` to exclude:
   - `.env` files
   - `node_modules/`
   - Go build artifacts
   - OS files (`.DS_Store`, `Thumbs.db`)
   - IDE files (`.vscode/`, `.idea/`)

#### Files to Create
- `docker-compose.yml`
- `.env.example`
- `backend/.env.example`
- `frontend/.env.example`
- `.gitignore` (update)

#### Acceptance Criteria
- [ ] Docker Compose file exists with all three services
- [ ] Environment example files exist with placeholder values
- [ ] `.gitignore` excludes all secrets and build artifacts
- [ ] Directory structure matches the documented architecture

---

### Phase 2 — Database Schema
**Milestone 2:** Create all PostgreSQL migration files for the 15 tables.

#### Tasks
1. Create `backend/migrations/` directory.
2. Create migration files in order:
   - `001_create_users.sql`
   - `002_create_refresh_tokens.sql`
   - `003_create_authors.sql`
   - `004_create_levels.sql`
   - `005_create_books.sql`
   - `006_create_book_authors.sql`
   - `007_create_categories.sql`
   - `008_create_book_categories.sql`
   - `009_create_topics.sql`
   - `010_create_book_topics.sql`
   - `011_create_ratings.sql`
   - `012_create_reviews.sql`
   - `013_create_saved_books.sql`
   - `014_create_bookmarks.sql`
   - `015_create_reading_progress.sql`
3. Each migration must include:
   - UUID primary keys (except `levels` which uses SMALLINT)
   - Foreign keys with appropriate `ON DELETE` behavior
   - Unique constraints (e.g., `(user_id, book_id)` for ratings/reviews/saved_books/progress)
   - NOT NULL constraints
   - Indexes on frequently queried fields (email, username, slugs, foreign keys)
4. Create a simple Go migration runner (`backend/cmd/migrate/main.go`) that:
   - Reads SQL files from `migrations/` in order
   - Tracks applied migrations in a `schema_migrations` table
   - Applies only unapplied migrations

#### Files to Create
- `backend/migrations/001_create_users.sql` through `015_create_reading_progress.sql`
- `backend/cmd/migrate/main.go`

#### Acceptance Criteria
- [ ] All 15 tables are defined
- [ ] Foreign keys and constraints match the database design document
- [ ] Indexes exist for frequently queried fields
- [ ] Migration runner applies migrations in order
- [ ] Migrations can run successfully against a fresh PostgreSQL database

---

### Phase 3 — Backend Skeleton
**Milestone 3:** Set up the Go backend project with layered structure, database connection, and health endpoint.

#### Tasks
1. Create Go project structure:
   ```
   backend/
   ├── cmd/
   │   ├── api/main.go
   │   ├── migrate/main.go
   │   └── seed/main.go
   ├── internal/
   │   ├── config/
   │   ├── database/
   │   ├── http/
   │   ├── auth/
   │   ├── users/
   │   ├── books/
   │   ├── authors/
   │   ├── categories/
   │   ├── topics/
   │   ├── reviews/
   │   ├── ratings/
   │   ├── library/
   │   ├── bookmarks/
   │   └── progress/
   ├── migrations/
   ├── go.mod
   └── .env.example
   ```
2. Create `go.mod` with dependencies:
   - `pg` (PostgreSQL driver)
   - `argon2` (password hashing)
   - `jwt` (JWT library)
   - `dotenv` (environment loading)
3. Implement configuration loader (`internal/config/`) that reads:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `ACCESS_TOKEN_EXPIRES`
   - `REFRESH_TOKEN_EXPIRES`
   - `FRONTEND_URL`
   - `PORT`
4. Implement database connection pool (`internal/database/`).
5. Implement HTTP server with a minimal router:
   - `GET /health` → `{"status": "ok"}`
   - Route registration mechanism
6. Implement `cmd/api/main.go` to start the server.

#### Files to Create
- `backend/go.mod`
- `backend/cmd/api/main.go`
- `backend/internal/config/config.go`
- `backend/internal/database/database.go`
- `backend/internal/http/router.go`
- `backend/internal/http/server.go`

#### Acceptance Criteria
- [ ] Go server starts and listens on the configured port
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] Database connection pool is established
- [ ] Configuration loads from environment variables
- [ ] Project structure follows the layered architecture

---

### Phase 4 — Backend Middleware
**Milestone 4:** Implement error handling, CORS, logging, and rate limiting middleware.

#### Tasks
1. Implement error handling middleware:
   - Consistent JSON error format: `{"error": {"code": "...", "message": "..."}}`
   - Map errors to appropriate HTTP status codes (400, 401, 403, 404, 409, 422, 429, 500)
   - Never expose stack traces or internal details in production
2. Implement CORS middleware:
   - Allow only `FRONTEND_URL` origin
   - Handle preflight OPTIONS requests
   - Never use `*` for authenticated production requests
3. Implement request logging middleware:
   - Log method, path, status code, response time
   - Never log passwords, tokens, or credentials
4. Implement rate limiting:
   - In-memory rate limiter (per IP)
   - Stricter limits for auth endpoints (login, signup, forgot-password, reset-password)
   - Standard limits for review/rating endpoints
   - Return `429 Too Many Requests` when exceeded

#### Files to Create
- `backend/internal/http/middleware/error_handler.go`
- `backend/internal/http/middleware/cors.go`
- `backend/internal/http/middleware/logger.go`
- `backend/internal/http/middleware/rate_limiter.go`

#### Acceptance Criteria
- [ ] Errors return consistent JSON format
- [ ] CORS allows only the configured frontend origin
- [ ] Requests are logged with method, path, status, and time
- [ ] Rate limiting returns 429 when thresholds are exceeded
- [ ] No sensitive data appears in logs or error responses

---

### Phase 5 — Auth: Signup & Login
**Milestone 5:** Implement user registration and login with secure password hashing and JWT issuance.

#### Tasks
1. Implement user repository (`internal/users/`):
   - `CreateUser(username, email, passwordHash)`
   - `FindByEmail(email)`
   - `FindByUsername(username)`
   - `FindById(id)`
2. Implement password hashing:
   - Use Argon2id
   - Never store plaintext passwords
3. Implement JWT utilities:
   - `GenerateAccessToken(userId)` → short-lived (15 min default)
   - `GenerateRefreshToken()` → cryptographically random
   - `HashRefreshToken(token)` → store hashed in DB
   - `ValidateAccessToken(token)`
4. Implement auth service:
   - `Signup(username, email, password)`:
     - Validate input (valid email, username length, password requirements)
     - Check for duplicate email/username → `409 Conflict`
     - Hash password
     - Create user
     - Generate tokens
     - Return user + tokens
   - `Login(email, password)`:
     - Find user by email
     - Verify password hash
     - Generate tokens
     - Return user + tokens
   - Invalid credentials → `401 Unauthorized`
5. Implement auth handlers:
   - `POST /api/v1/auth/signup`
   - `POST /api/v1/auth/login`
6. Implement refresh token repository:
   - `Create(userId, tokenHash, expiresAt)`
   - `FindByTokenHash(tokenHash)`
   - `Revoke(tokenHash)`

#### Files to Create
- `backend/internal/users/user.go`
- `backend/internal/users/user_repository.go`
- `backend/internal/users/user_service.go`
- `backend/internal/auth/password.go`
- `backend/internal/auth/jwt.go`
- `backend/internal/auth/refresh_token_repository.go`
- `backend/internal/auth/auth_service.go`
- `backend/internal/auth/auth_handler.go`

#### Acceptance Criteria
- [ ] `POST /auth/signup` creates a user and returns tokens
- [ ] Duplicate email/username returns `409 Conflict`
- [ ] Invalid signup input returns `422 Unprocessable Entity`
- [ ] `POST /auth/login` returns tokens for valid credentials
- [ ] Invalid credentials return `401 Unauthorized`
- [ ] Passwords are hashed with Argon2id (never plaintext)
- [ ] Refresh tokens are stored hashed in the database

---

### Phase 6 — Auth: Token Management & Password Reset
**Milestone 6:** Implement refresh, logout, forgot-password, and reset-password endpoints.

#### Tasks
1. Implement `POST /api/v1/auth/refresh`:
   - Accept refresh token
   - Validate token exists, is not revoked, and is not expired
   - Generate new access token and new refresh token
   - Revoke the old refresh token
   - Return new tokens
   - Invalid/expired → `401 Unauthorized`
2. Implement `POST /api/v1/auth/logout`:
   - Require authentication
   - Accept refresh token
   - Revoke the refresh token
   - Return `204 No Content`
3. Implement `POST /api/v1/auth/forgot-password`:
   - Accept email
   - Always return generic response (prevent account enumeration):
     > "If an account exists for this email, instructions have been sent."
   - If user exists, generate a signed JWT reset token
   - For MVP: return the reset token in the response (development mode)
   - Provide a pluggable email interface for production
4. Implement `POST /api/v1/auth/reset-password`:
   - Accept reset token + new password
   - Validate token signature and expiry
   - Update user's password hash
   - Return `204 No Content`
5. Implement authentication middleware:
   - Parse `Authorization: Bearer <token>`
   - Validate access token
   - Attach user ID to request context
   - Return `401 Unauthorized` for missing/invalid tokens

#### Files to Create
- `backend/internal/auth/token_handler.go`
- `backend/internal/auth/password_reset.go`
- `backend/internal/auth/auth_middleware.go`
- `backend/internal/email/email_service.go` (interface + dev implementation)

#### Acceptance Criteria
- [ ] `POST /auth/refresh` returns new tokens and revokes old refresh token
- [ ] `POST /auth/logout` revokes the refresh token and returns 204
- [ ] `POST /auth/forgot-password` returns a generic response regardless of email existence
- [ ] `POST /auth/reset-password` updates the password for a valid token
- [ ] Protected endpoints reject requests without a valid access token
- [ ] Expired/invalid refresh tokens return `401 Unauthorized`

---

### Phase 7 — Books API
**Milestone 7:** Implement book listing and book details endpoints.

#### Tasks
1. Implement book repository (`internal/books/`):
   - `ListBooks(filters, pagination)` → paginated book summaries
   - `FindBySlug(slug)` → full book details
   - `GetRatingSummary(bookId)` → average + count
   - `GetRelatedBooks(bookId, levelId, categoryIds, topicIds)` → related books
2. Implement book service:
   - Validate pagination parameters (page ≥ 1, 1 ≤ limit ≤ 100)
   - Validate slug format
   - Return `404 Book Not Found` for unknown slugs
3. Implement book handlers:
   - `GET /api/v1/books` → paginated list with:
     - `data`: array of book summaries (id, title, slug, cover_url, level, rating)
     - `meta`: page, limit, total, total_pages
   - `GET /api/v1/books/:slug` → full details with:
     - id, title, slug, description, cover_url
     - authors, level, categories, topics
     - source_url, license, publication_date
     - rating (average, count)
4. Implement chapter endpoints (every book is hosted in-system):
    - `GET /api/v1/books/:slug/chapters` → chapter list (id, slug, title, chapter_order) for the TOC
    - `GET /api/v1/books/:slug/chapters/:chapterSlug` → full chapter content (Markdown/HTML)
    - Unknown book or chapter → `404 Not Found`
5. Implement book DTOs (data transfer objects) for consistent JSON responses.

#### Files to Create
- `backend/internal/books/book.go`
- `backend/internal/books/book_repository.go`
- `backend/internal/books/book_service.go`
- `backend/internal/books/book_handler.go`
- `backend/internal/books/book_dto.go`
- `backend/internal/books/chapter_repository.go`
- `backend/migrations/016_create_chapters.sql`

#### Acceptance Criteria
- [ ] `GET /books` returns paginated book summaries
- [ ] `GET /books/:slug` returns full book details
- [ ] Unknown slug returns `404 Book Not Found`
- [ ] Invalid pagination returns `422 Unprocessable Entity`
- [ ] Rating summary (average + count) is included in responses
- [ ] `GET /books/:slug/chapters` returns the chapter list for the TOC
- [ ] `GET /books/:slug/chapters/:chapterSlug` returns full chapter content
- [ ] Unknown book or chapter returns `404 Not Found`
- [ ] Responses follow the documented JSON structure

---

### Phase 8 — Search, Filter & Sort API
**Milestone 8:** Add search, filtering, and sorting capabilities to the books endpoint.

#### Tasks
1. Implement search:
   - Add PostgreSQL full-text search using `tsvector`/`tsquery`
   - Search across: title, description, author name, category name, topic name
   - Add `ILIKE` fallback for partial/keyword matching
   - Add a search index migration for the search strategy
2. Implement filtering:
   - `level` → filter by level slug
   - `category` → filter by category slug
   - `topic` → filter by topic slug
   - `rating` → filter by minimum average rating (e.g., `rating=4` means 4+)
   - Filters must be combinable
3. Implement sorting:
   - `newest` → sort by `publication_date`/`created_at` descending
   - `rating` → sort by average rating descending
   - `most-rated` → sort by rating count descending
   - Default sort: `newest`
4. Update book repository to support:
   - Dynamic WHERE clauses with parameterized queries
   - JOINs for author/category/topic filters
   - Aggregation for rating-based sorting
5. Validate all filter/sort parameters:
   - Invalid level/category/topic → `422 Unprocessable Entity`
   - Invalid sort option → `422 Unprocessable Entity`

#### Files to Update
- `backend/internal/books/book_repository.go`
- `backend/internal/books/book_service.go`
- `backend/internal/books/book_handler.go`
- `backend/migrations/016_add_search_indexes.sql` (new)

#### Acceptance Criteria
- [ ] `GET /books?search=burp` returns relevant Burp Suite books
- [ ] `GET /books?level=3&category=web-pentesting&rating=4` combines filters
- [ ] `GET /books?sort=rating` sorts by highest rated
- [ ] `GET /books?sort=most-rated` sorts by most rated
- [ ] Invalid filter/sort values return `422 Unprocessable Entity`
- [ ] Search uses parameterized queries (no SQL injection)

---

### Phase 9 — Taxonomy API
**Milestone 9:** Implement levels, categories, topics, and authors endpoints.

#### Tasks
1. Implement level repository + service + handler:
   - `GET /api/v1/levels` → list all levels
   - `GET /api/v1/levels/:slug` → level info + its books
2. Implement category repository + service + handler:
   - `GET /api/v1/categories` → list all categories
   - `GET /api/v1/categories/:slug` → category info + matching books
3. Implement topic repository + service + handler:
   - `GET /api/v1/topics` → list all topics
   - `GET /api/v1/topics/:slug` → topic info + matching books
4. Implement author repository + service + handler:
   - `GET /api/v1/authors` → list authors (paginated)
   - `GET /api/v1/authors/:slug` → author info + their books
5. Return `404 Not Found` for unknown slugs.
6. Include book summaries (id, title, slug, cover_url, rating) in taxonomy detail responses.

#### Files to Create
- `backend/internal/levels/level.go`
- `backend/internal/levels/level_repository.go`
- `backend/internal/levels/level_service.go`
- `backend/internal/levels/level_handler.go`
- `backend/internal/categories/category.go`
- `backend/internal/categories/category_repository.go`
- `backend/internal/categories/category_service.go`
- `backend/internal/categories/category_handler.go`
- `backend/internal/topics/topic.go`
- `backend/internal/topics/topic_repository.go`
- `backend/internal/topics/topic_service.go`
- `backend/internal/topics/topic_handler.go`
- `backend/internal/authors/author.go`
- `backend/internal/authors/author_repository.go`
- `backend/internal/authors/author_service.go`
- `backend/internal/authors/author_handler.go`

#### Acceptance Criteria
- [ ] `GET /levels` returns the 4 levels
- [ ] `GET /levels/:slug` returns level info + books
- [ ] `GET /categories` returns all categories
- [ ] `GET /categories/:slug` returns category info + books
- [ ] `GET /topics` returns all topics
- [ ] `GET /topics/:slug` returns topic info + books
- [ ] `GET /authors` returns paginated authors
- [ ] `GET /authors/:slug` returns author info + books
- [ ] Unknown slugs return `404 Not Found`

---

### Phase 10 — Ratings & Reviews API
**Milestone 10:** Implement rating and review endpoints with ownership verification.

#### Tasks
1. Implement rating repository:
   - `Upsert(userId, bookId, rating)` → create or update
   - `Delete(userId, bookId)`
   - `FindByUserAndBook(userId, bookId)`
2. Implement rating handler:
   - `PUT /api/v1/books/:bookId/rating` (auth required)
     - Validate rating is 1–5 → else `422`
     - Create if none exists, update if exists
   - `DELETE /api/v1/books/:bookId/rating` (auth required)
     - Delete user's rating → `204 No Content`
3. Implement review repository:
   - `Create(userId, bookId, content)`
   - `Update(reviewId, content)`
   - `Delete(reviewId)`
   - `FindByBook(bookId)` → with user info
   - `FindById(reviewId)`
   - `FindByUserAndBook(userId, bookId)`
4. Implement review handler:
   - `GET /api/v1/books/:bookId/reviews` (public) → list reviews with user info
   - `POST /api/v1/books/:bookId/reviews` (auth required)
     - Validate content is not empty and within max length → else `422`
     - One review per user/book → duplicate returns `409 Conflict`
     - Return `201 Created`
   - `PUT /api/v1/reviews/:reviewId` (auth required)
     - Verify review belongs to the authenticated user → else `403 Forbidden`
     - Update content → `200 OK`
   - `DELETE /api/v1/reviews/:reviewId` (auth required)
     - Verify review belongs to the authenticated user → else `403 Forbidden`
     - Delete review → `204 No Content`

#### Files to Create
- `backend/internal/ratings/rating.go`
- `backend/internal/ratings/rating_repository.go`
- `backend/internal/ratings/rating_handler.go`
- `backend/internal/reviews/review.go`
- `backend/internal/reviews/review_repository.go`
- `backend/internal/reviews/review_handler.go`

#### Acceptance Criteria
- [ ] `PUT /books/:bookId/rating` creates or updates the user's rating
- [ ] Invalid rating (outside 1–5) returns `422 Unprocessable Entity`
- [ ] `DELETE /books/:bookId/rating` removes the user's rating
- [ ] `GET /books/:bookId/reviews` is public and returns reviews with user info
- [ ] `POST /books/:bookId/reviews` creates a review (one per user/book)
- [ ] Duplicate review returns `409 Conflict`
- [ ] `PUT /reviews/:reviewId` updates only the owner's review
- [ ] `DELETE /reviews/:reviewId` deletes only the owner's review
- [ ] Non-owner update/delete returns `403 Forbidden`

---

### Phase 11 — Library API
**Milestone 11:** Implement saved books, bookmarks, reading progress, and current user endpoints.

#### Tasks
1. Implement saved books repository + handler:
   - `GET /api/v1/me/library` (auth) → saved books + currently reading + progress summary
   - `POST /api/v1/me/library/:bookId` (auth) → save book, `201 Created`
   - Already saved → `409 Conflict`
   - `DELETE /api/v1/me/library/:bookId` (auth) → remove saved book, `204 No Content`
2. Implement bookmarks repository + handler:
   - `GET /api/v1/me/bookmarks` (auth) → all user bookmarks
   - `GET /api/v1/me/books/:bookId/bookmarks` (auth) → bookmarks for a specific book
   - `POST /api/v1/me/books/:bookId/bookmarks` (auth) → create bookmark
     - Request: `{"location": "...", "note": "..."}`
     - Validate location is not empty → else `422`
     - Return `201 Created`
   - `DELETE /api/v1/me/bookmarks/:bookmarkId` (auth) → delete bookmark, `204 No Content`
   - Verify bookmark ownership → else `403 Forbidden`
3. Implement reading progress repository + handler:
   - `GET /api/v1/me/books/:bookId/progress` (auth) → `{"location": "...", "percentage": 47.5}`
   - `PUT /api/v1/me/books/:bookId/progress` (auth) → create/update progress
     - Validate 0 ≤ percentage ≤ 100 → else `422`
   - `DELETE /api/v1/me/books/:bookId/progress` (auth) → `204 No Content`
4. Implement current user endpoint:
   - `GET /api/v1/me` (auth) → user id, username, email

#### Files to Create
- `backend/internal/library/library_repository.go`
- `backend/internal/library/library_handler.go`
- `backend/internal/bookmarks/bookmark.go`
- `backend/internal/bookmarks/bookmark_repository.go`
- `backend/internal/bookmarks/bookmark_handler.go`
- `backend/internal/progress/progress_repository.go`
- `backend/internal/progress/progress_handler.go`
- `backend/internal/users/me_handler.go`

#### Acceptance Criteria
- [ ] `GET /me/library` returns saved books and reading progress
- [ ] `POST /me/library/:bookId` saves a book
- [ ] Duplicate save returns `409 Conflict`
- [ ] `DELETE /me/library/:bookId` removes a saved book
- [ ] `GET /me/bookmarks` returns user bookmarks
- [ ] `POST /me/books/:bookId/bookmarks` creates a bookmark
- [ ] `DELETE /me/bookmarks/:bookmarkId` deletes a bookmark
- [ ] `GET/PUT/DELETE /me/books/:bookId/progress` manages reading progress
- [ ] `GET /me` returns the authenticated user
- [ ] All library endpoints require authentication
- [ ] Ownership is verified for bookmarks

---

### Phase 12 — Frontend Foundation
**Milestone 12:** Set up Next.js + TypeScript + Tailwind with the design system and layout.

#### Tasks
1. Create Next.js project in `frontend/`:
   - Next.js App Router
   - TypeScript
   - Tailwind CSS
2. Configure Tailwind with the design system:
   - Dark-first color palette (deep grays/blacks, subtle accent color)
   - Technical typography (monospace accents for terminal/security feel)
   - Spacing scale
   - Border radius, shadows
3. Create base layout components:
   - `Header` (logo, navigation, search link, auth buttons)
   - `Footer`
   - `Layout` wrapper
4. Create reusable UI components:
   - `Button`
   - `Input`
   - `Card`
   - `Badge`
   - `BookCard` (cover, title, author, rating)
   - `RatingStars`
   - `Pagination`
   - `EmptyState`
   - `LoadingState`
   - `ErrorState`
5. Set up global styles:
   - `globals.css` with Tailwind directives
   - CSS variables for the design system
6. Configure responsive behavior:
   - Mobile navigation (hamburger menu)
   - Responsive grid for book cards
   - Responsive spacing

#### Files to Create
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/next.config.js`
- `frontend/tailwind.config.ts`
- `frontend/postcss.config.js`
- `frontend/app/layout.tsx`
- `frontend/app/globals.css`
- `frontend/components/layout/Header.tsx`
- `frontend/components/layout/Footer.tsx`
- `frontend/components/layout/Layout.tsx`
- `frontend/components/ui/Button.tsx`
- `frontend/components/ui/Input.tsx`
- `frontend/components/ui/Card.tsx`
- `frontend/components/ui/Badge.tsx`
- `frontend/components/books/BookCard.tsx`
- `frontend/components/books/RatingStars.tsx`
- `frontend/components/ui/Pagination.tsx`
- `frontend/components/ui/EmptyState.tsx`
- `frontend/components/ui/LoadingState.tsx`
- `frontend/components/ui/ErrorState.tsx`

#### Acceptance Criteria
- [ ] Next.js app starts and renders the base layout
- [ ] Tailwind is configured with the dark-first design system
- [ ] Header, footer, and layout components render correctly
- [ ] Reusable UI components exist
- [ ] Layout is responsive on desktop, tablet, and mobile
- [ ] Design reflects a premium technical bookstore with subtle hacker aesthetic

---

### Phase 13 — Frontend Data Layer
**Milestone 13:** Create API client, TypeScript types, TanStack Query hooks, and auth state management.

#### Tasks
1. Create TypeScript types (`frontend/types/`):
   - `User`
   - `Book`
   - `BookSummary`
   - `Author`
   - `Level`
   - `Category`
   - `Topic`
   - `Rating`
   - `Review`
   - `Bookmark`
   - `ReadingProgress`
   - `Pagination`
   - `ApiError`
   - `AuthResponse`
2. Create API client (`frontend/lib/api.ts`):
   - Base URL from `NEXT_PUBLIC_API_URL`
   - `get`, `post`, `put`, `delete` methods
   - JSON serialization/deserialization
   - Error handling (parse `ApiError` format)
   - Attach `Authorization: Bearer <access_token>` for authenticated requests
3. Create TanStack Query hooks (`frontend/hooks/`):
   - `useBooks` (list with filters)
   - `useBook` (details by slug)
   - `useLevels`, `useCategories`, `useTopics`, `useAuthors`
   - `useReviews`
   - `useLibrary`, `useBookmarks`, `useProgress`
   - `useSaveBook`, `useRateBook`, `useReviewBook`, `useBookmark`, `useProgress` (mutations)
4. Implement authentication state management:
   - Access token in memory
   - Refresh token in HttpOnly cookie (production) / dev cookie (development)
   - `useAuth` hook → `{ user, status, login, signup, logout, refresh }`
   - Protected route redirect logic (redirect to `/login` if unauthenticated)

#### Files to Create
- `frontend/types/index.ts`
- `frontend/lib/api.ts`
- `frontend/lib/auth.ts`
- `frontend/hooks/useBooks.ts`
- `frontend/hooks/useBook.ts`
- `frontend/hooks/useTaxonomy.ts`
- `frontend/hooks/useReviews.ts`
- `frontend/hooks/useLibrary.ts`
- `frontend/hooks/useAuth.ts`

#### Acceptance Criteria
- [ ] TypeScript types match the API contracts
- [ ] API client handles requests, responses, and errors correctly
- [ ] TanStack Query hooks exist for all API endpoints
- [ ] Auth state tracks unauthenticated/authenticated/loading states
- [ ] Protected routes redirect unauthenticated users to `/login`
- [ ] Public pages remain accessible without authentication

---

### Phase 14 — Homepage
**Milestone 14:** Build the homepage with search, featured, popular, recent, and level sections.

#### Tasks
1. Create `app/page.tsx` (homepage):
   - Project introduction/hero section
   - Main search bar (navigates to `/books?search=...`)
   - Link to browse all books
2. Create sections:
   - Featured books (curated selection)
   - Popular/highly rated books (`GET /books?sort=rating&limit=...`)
   - Recently added books (`GET /books?sort=newest&limit=...`)
   - Books grouped by level (`GET /books?level=1..4`)
3. Use SSR (server-side rendering) for SEO:
   - Fetch data server-side
   - Render book cards
4. Add SEO metadata:
   - Title, description, Open Graph tags
5. Handle loading/error/empty states for each section.

#### Files to Create
- `frontend/app/page.tsx`
- `frontend/components/home/Hero.tsx`
- `frontend/components/home/SearchBar.tsx`
- `frontend/components/home/FeaturedBooks.tsx`
- `frontend/components/home/PopularBooks.tsx`
- `frontend/components/home/RecentBooks.tsx`
- `frontend/components/home/LevelsSection.tsx`

#### Acceptance Criteria
- [ ] Homepage renders with hero, search bar, and browse link
- [ ] Featured, popular, recent, and level sections display books
- [ ] Search bar navigates to the catalog with the query
- [ ] Sections handle loading, error, and empty states
- [ ] SEO metadata is present
- [ ] Homepage is responsive

---

### Phase 15 — Books Listing Page
**Milestone 15:** Build the catalog page with search, filters, sorting, and pagination.

#### Tasks
1. Create `app/books/page.tsx`:
   - Read query parameters: `search`, `level`, `category`, `topic`, `rating`, `sort`, `page`
   - Fetch books with filters via `GET /books`
2. Build search bar:
   - Debounced input
   - Updates URL query parameters
3. Build filter sidebar:
   - Level filter (checkboxes/select)
   - Category filter
   - Topic filter
   - Rating filter (minimum rating)
   - Filters are combinable
   - Clear all filters button
4. Build sort dropdown:
   - Newest
   - Highest rated
   - Most rated
5. Build results grid:
   - Book cards
   - Result count
   - Pagination controls
6. Handle empty state:
   - "No books found" message
   - Clear filters action
7. Handle loading and error states.

#### Files to Create
- `frontend/app/books/page.tsx`
- `frontend/components/catalog/SearchBar.tsx`
- `frontend/components/catalog/FilterSidebar.tsx`
- `frontend/components/catalog/SortDropdown.tsx`
- `frontend/components/catalog/ResultsGrid.tsx`
- `frontend/components/catalog/ResultCount.tsx`

#### Acceptance Criteria
- [ ] Catalog page displays books with pagination
- [ ] Search updates results with debounce
- [ ] Filters are combinable and update results
- [ ] Sorting works for newest, rating, most-rated
- [ ] Empty state shows when no results
- [ ] Loading and error states are handled
- [ ] URL reflects current search/filter/sort/page state

---

### Phase 16 — Book Details Page
**Milestone 16:** Build the book details page with metadata, rating, reviews, related books, and Read button.

#### Tasks
1. Create `app/books/[slug]/page.tsx`:
   - Fetch book details via `GET /books/:slug`
   - Fetch reviews via `GET /books/:bookId/reviews`
   - Fetch related books (from book details or separate query)
2. Display:
   - Cover image
   - Title, author(s)
   - Description
   - Level badge
   - Categories and topics
   - Rating (average + count + stars)
   - Source URL
   - License/availability
   - Publication date
   - Read button (links to the in-system reader `/read/[slug]` — no external reading links)
3. Display reviews section:
   - List of reviews (username, rating, content, date)
   - Review form for authenticated users
   - Edit/delete for the user's own review
4. Display related books section:
   - "You may also like" book cards
5. Add SEO metadata:
   - Title, description, Open Graph, canonical URL
6. Handle book-not-found state.

#### Files to Create
- `frontend/app/books/[slug]/page.tsx`
- `frontend/components/book/BookInfo.tsx`
- `frontend/components/book/BookActions.tsx`
- `frontend/components/book/ReviewsSection.tsx`
- `frontend/components/book/ReviewForm.tsx`
- `frontend/components/book/RelatedBooks.tsx`

#### Acceptance Criteria
- [ ] Book details page displays all book metadata
- [ ] Rating (average + count) is displayed
- [ ] Reviews are listed with user info
- [ ] Authenticated users can create/edit/delete their review
- [ ] Related books are displayed
- [ ] Read button links to the in-system reader (no external reading links)
- [ ] Book-not-found state is handled
- [ ] SEO metadata is present

---

### Phase 17 — Taxonomy & Author Pages
**Milestone 17:** Build category, topic, level, and author pages.

#### Tasks
1. Create `app/categories/[slug]/page.tsx`:
   - Fetch category info + books via `GET /categories/:slug`
   - Display name, description, result count, book grid
2. Create `app/topics/[slug]/page.tsx`:
   - Fetch topic info + books via `GET /topics/:slug`
   - Display name, result count, book grid
3. Create `app/levels/[slug]/page.tsx`:
   - Fetch level info + books via `GET /levels/:slug`
   - Display name, description, result count, book grid
4. Create `app/authors/[slug]/page.tsx`:
   - Fetch author info + books via `GET /authors/:slug`
   - Display name, bio, book grid
5. Add SEO metadata for each page type.
6. Handle not-found and empty states.

#### Files to Create
- `frontend/app/categories/[slug]/page.tsx`
- `frontend/app/topics/[slug]/page.tsx`
- `frontend/app/levels/[slug]/page.tsx`
- `frontend/app/authors/[slug]/page.tsx`
- `frontend/components/taxonomy/TaxonomyHeader.tsx`
- `frontend/components/taxonomy/BookGrid.tsx`

#### Acceptance Criteria
- [ ] Category pages show name, description, and matching books
- [ ] Topic pages show name and matching books
- [ ] Level pages show name, description, and matching books
- [ ] Author pages show name, bio, and their books
- [ ] Result counts are displayed
- [ ] Not-found and empty states are handled
- [ ] SEO metadata is present

---

### Phase 18 — Auth Pages
**Milestone 18:** Build login and signup pages with form validation and error handling.

#### Tasks
1. Create `app/login/page.tsx`:
   - Email + password form
   - React Hook Form + Zod validation
   - Submit → `POST /auth/login`
   - Store tokens, redirect to intended page or `/library`
   - Error display (invalid credentials, network errors)
2. Create `app/signup/page.tsx`:
   - Username + email + password form
   - React Hook Form + Zod validation
   - Submit → `POST /auth/signup`
   - Store tokens, redirect to `/library`
   - Error display (duplicate email/username, validation errors)
3. Add password requirements hint:
   - Minimum length
   - Complexity requirements
4. Add "forgot password" link (placeholder for MVP).
5. Redirect already-authenticated users away from auth pages.
6. Ensure forms are accessible (labels, focus states, error messages).

#### Files to Create
- `frontend/app/login/page.tsx`
- `frontend/app/signup/page.tsx`
- `frontend/components/auth/LoginForm.tsx`
- `frontend/components/auth/SignupForm.tsx`
- `frontend/lib/validators.ts`

#### Acceptance Criteria
- [ ] Login form validates input and displays errors
- [ ] Signup form validates input and displays errors
- [ ] Successful login/signup stores tokens and redirects
- [ ] Invalid credentials show a clear error message
- [ ] Duplicate email/username shows a clear error message
- [ ] Forms are accessible and keyboard-navigable
- [ ] Already-authenticated users are redirected away

---

### Phase 19 — Library & Profile Pages
**Milestone 19:** Build the library page (saved, currently reading, bookmarks) and profile page.

#### Tasks
1. Create `app/library/page.tsx` (protected route):
   - Fetch library data via `GET /me/library`
   - Fetch bookmarks via `GET /me/bookmarks`
   - Tabs/sections:
     - Saved Books
     - Currently Reading (with progress percentage)
     - Bookmarks (with location and note)
   - Each book links to its details/reader
   - Empty states for each section
2. Create `app/profile/page.tsx` (protected route):
   - Fetch user via `GET /me`
   - Display username, email
   - Display activity summary:
     - Saved book count
     - Reading activity
     - Review count
   - Logout button
3. Add route protection:
   - Redirect unauthenticated users to `/login`
   - Redirect back after login

#### Files to Create
- `frontend/app/library/page.tsx`
- `frontend/app/profile/page.tsx`
- `frontend/components/library/LibraryTabs.tsx`
- `frontend/components/library/SavedBooksSection.tsx`
- `frontend/components/library/CurrentlyReadingSection.tsx`
- `frontend/components/library/BookmarksSection.tsx`
- `frontend/components/profile/ProfileInfo.tsx`
- `frontend/components/profile/ActivitySummary.tsx`

#### Acceptance Criteria
- [ ] Library page shows saved books, currently reading, and bookmarks
- [ ] Each section has an empty state
- [ ] Books link to their details/reader
- [ ] Profile page shows user info and activity summary
- [ ] Logout works and redirects to homepage
- [ ] Unauthenticated users are redirected to `/login`

---

### Phase 20 — Online Reader
**Milestone 20:** Build the online reader with navigation, controls, bookmarks, and progress tracking.

#### Tasks
1. Create `app/read/[slug]/page.tsx`:
   - Fetch book details and chapter list
   - Render the internal reader with hosted chapter content (all cataloged books are hosted in-system)
   - Fetch chapters one at a time via the chapter API (performance: never load the whole book)
   - Show source/license attribution footer (informational only — never a reading path)
2. Build reader layout:
   - Table of contents sidebar
   - Chapter content area
   - Previous/next chapter navigation
3. Build reader controls:
   - Font-size increase/decrease
   - Light/dark reading mode
   - Fullscreen toggle
   - Search within book (client-side search of chapter content)
4. Implement bookmarks (authenticated users):
   - Bookmark current location
   - Add optional note
   - View bookmarks for this book
   - Delete bookmarks
5. Implement reading progress (authenticated users):
   - Save progress on scroll/chapter change
   - Show reading percentage
   - On return, offer "Continue from saved position"
6. Handle reader-unavailable state.
7. Ensure reader is keyboard-friendly and responsive.

#### Files to Create
- `frontend/app/read/[slug]/page.tsx`
- `frontend/components/reader/ReaderLayout.tsx`
- `frontend/components/reader/TableOfContents.tsx`
- `frontend/components/reader/ChapterContent.tsx`
- `frontend/components/reader/ReaderControls.tsx`
- `frontend/components/reader/ReaderSearch.tsx`
- `frontend/components/reader/BookmarksPanel.tsx`
- `frontend/components/reader/ProgressBar.tsx`
- `frontend/lib/reader.ts` (content loading, progress calculation)

#### Acceptance Criteria
- [ ] Reader renders hosted book content
- [ ] Table of contents and chapter navigation work
- [ ] Previous/next navigation works
- [ ] Font-size controls work
- [ ] Light/dark reading mode works
- [ ] Fullscreen mode works
- [ ] Search within book works
- [ ] Authenticated users can create/view/delete bookmarks
- [ ] Reading progress is saved and restored
- [ ] Full book content is read inside HackShelf (no external reading redirect)
- [ ] Source/license attribution is shown on the book page
- [ ] Reader is responsive and keyboard-friendly

---

### Phase 21 — Seed Data
**Milestone 21:** Create the seed script with ~100 legitimate free cybersecurity books.

#### Tasks
1. Create `backend/cmd/seed/main.go`:
   - Connect to database
   - Run migrations if not already applied
   - Insert seed data
2. Create seed data files:
   - `backend/seed/levels.json` → 4 levels
   - `backend/seed/authors.json` → authors
   - `backend/seed/categories.json` → categories
   - `backend/seed/topics.json` → topics
   - `backend/seed/books.json` → ~100 books with:
     - Title, slug, description, cover_url
     - Level, authors, categories, topics
     - source_url, license, publication_date
3. Curate ~100 legitimate free books — INCLUSION RULE: the license must permit redistribution (open-source/CC/public-domain) OR written author permission must be on file:
   - Open-source books (e.g., OWASP guides, O'Reilly open books)
   - Creative Commons resources (CC BY, CC BY-SA)
   - Public-domain security texts
   - Books with written author permission (recorded in the wishlist log)
   - Each book must have a clear source and license
4. Convert each included book into hosted chapter content (Markdown/HTML files) so the full book is readable inside HackShelf — no external reading links.
5. Maintain `docs/WISHLIST.md`: popular free-to-read books whose license does not allow rehosting, tracked for author-permission outreach; excluded from the catalog until approved.
6. Create initial ratings/reviews:
   - Use the project owner's real account (not fake users)
   - Seed a few ratings/reviews for popular books
7. Make the seed script idempotent:
   - Skip already-seeded data
   - Use slugs/unique keys to avoid duplicates

#### Files to Create
- `backend/cmd/seed/main.go`
- `backend/seed/levels.json`
- `backend/seed/authors.json`
- `backend/seed/categories.json`
- `backend/seed/topics.json`
- `backend/seed/books.json`
- `backend/seed/chapters/<book-slug>/*.md` (chapter content per book)
- `docs/WISHLIST.md`

#### Acceptance Criteria
- [ ] Seed script runs successfully
- [ ] 4 levels are created
- [ ] ~100 books are created with complete metadata
- [ ] Authors, categories, topics, and relationships are created
- [ ] Every book has a legitimate source and license permitting redistribution (or recorded author permission)
- [ ] Every book has hosted chapter content readable inside HackShelf
- [ ] Wishlist of pending-permission books is maintained
- [ ] Initial ratings/reviews use the project owner's real account
- [ ] Seed script is idempotent (safe to re-run)

---

### Phase 22 — Deployment & Final Polish
**Milestone 22:** Deploy to production and perform final polish, security, and testing.

#### Tasks
1. Frontend deployment:
   - Deploy Next.js to Vercel
   - Configure `NEXT_PUBLIC_API_URL`
   - Verify HTTPS
   - Verify SEO metadata
2. Backend deployment:
   - Create production Docker image (multi-stage Go build)
   - Deploy to Docker-based hosting (e.g., Render)
   - Configure environment variables (DATABASE_URL, JWT secrets, FRONTEND_URL)
   - Configure CORS for production origin
   - Verify `GET /health`
3. Database deployment:
   - Create managed PostgreSQL (e.g., Neon)
   - Run migrations
   - Run seed script
   - Enable automated backups
   - Restrict network access
4. Security hardening:
   - Verify Argon2id password hashing
   - Verify JWT secrets are production secrets
   - Verify secure cookies (HttpOnly, Secure, SameSite)
   - Verify CORS is restricted
   - Verify rate limiting is active
   - Verify production error messages are sanitized
   - Configure security headers (CSP, X-Content-Type-Options, etc.)
   - Verify HTTPS everywhere
   - Check dependencies for known vulnerabilities
5. Performance optimization:
   - Optimize book cover images
   - Verify pagination works
   - Verify caching of public data
   - Verify SSR for public pages
6. Final testing:
   - Test all error/empty states
   - Test responsive behavior on desktop, tablet, mobile
   - Test all user flows (visitor + registered user)
   - Test reader features
   - Test library features
   - Verify all acceptance criteria from the requirements document

#### Files to Create
- `frontend/Dockerfile` (if needed)
- `backend/Dockerfile`
- `backend/Dockerfile.prod` (if separate)
- Deployment configuration files as needed

#### Acceptance Criteria
- [ ] Frontend is deployed and accessible via HTTPS
- [ ] Backend is deployed and accessible via HTTPS
- [ ] Database is deployed with migrations and seed data
- [ ] All security checklist items are verified
- [ ] All error/empty states are handled
- [ ] Application is responsive on all device sizes
- [ ] All core user flows work in production
- [ ] Definition of Done from the requirements document is met

---

## 6. Dependency Graph

```
Phase 1  → Phase 2  → Phase 3  → Phase 4  → Phase 5  → Phase 6
Phase 6  → Phase 7  → Phase 8  → Phase 9  → Phase 10 → Phase 11
Phase 11 → Phase 12 → Phase 13 → Phase 14 → Phase 15 → Phase 16
Phase 16 → Phase 17 → Phase 18 → Phase 19 → Phase 20 → Phase 21
Phase 21 → Phase 22
```

Each phase depends only on the previous phase. There are no forward dependencies.

---

## 7. Definition of Done (MVP Complete)

The MVP is complete when all 22 milestones are implemented and verified:

- [ ] Milestone 1: Project foundation exists
- [ ] Milestone 2: Database schema is migrated
- [ ] Milestone 3: Backend skeleton runs
- [ ] Milestone 4: Middleware works
- [ ] Milestone 5: Signup/login works
- [ ] Milestone 6: Token management works
- [ ] Milestone 7: Books API works
- [ ] Milestone 8: Search/filter/sort works
- [ ] Milestone 9: Taxonomy API works
- [ ] Milestone 10: Ratings/reviews work
- [ ] Milestone 11: Library API works
- [ ] Milestone 12: Frontend foundation exists
- [ ] Milestone 13: Data layer works
- [ ] Milestone 14: Homepage works
- [ ] Milestone 15: Catalog page works
- [ ] Milestone 16: Book details page works
- [ ] Milestone 17: Taxonomy/author pages work
- [ ] Milestone 18: Auth pages work
- [ ] Milestone 19: Library/profile pages work
- [ ] Milestone 20: Reader works
- [ ] Milestone 21: Seed data is loaded
- [ ] Milestone 22: Production deployment works

---

## 8. Out of Scope (Not Implemented)

The following are explicitly NOT part of this implementation plan:

- Paid books, shopping cart, payments, e-commerce
- Courses, lessons, quizzes, certificates, learning paths
- AI tutor, AI recommendations
- Social networking, gamification
- Admin dashboard, complex CMS
- Kubernetes, microservices, load balancers
- Elasticsearch, Redis, message queues
- Complex CI/CD pipelines
- Complex monitoring systems