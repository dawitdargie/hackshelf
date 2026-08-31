# HackShelf — System Architecture

## 1. Architecture Overview
HackShelf is a full-stack web application consisting of three primary components:

```
User
  ↓
Next.js Frontend
  ↓
Go REST API
  ↓
PostgreSQL
```

Book content is served from hosted chapter files (Markdown/HTML) in the platform. Only books with redistribution rights (or author permission) are cataloged; the official source is shown as attribution only.

The system is intentionally simple. There is no admin application, payment system, CMS, or microservice architecture.

## 2. System Components

### Frontend
Next.js + TypeScript + Tailwind CSS
Responsible for:

* User interface
* Navigation
* Book discovery
* Search/filter UI
* Book details
* Reader
* Authentication UI
* User library
* Ratings/reviews
* Bookmarks
* Reading progress

### Backend
Go REST API
Responsible for:

* Business logic
* Authentication
* Authorization
* Book data
* Search/filtering
* Ratings
* Reviews
* Saved books
* Bookmarks
* Reading progress
* Database communication

The frontend MUST NOT directly access PostgreSQL.

### Database
PostgreSQL
Stores:

* Users
* Books
* Authors
* Categories
* Topics
* Ratings
* Reviews
* Saved books
* Bookmarks
* Reading progress
* Refresh tokens

## 3. High-Level Architecture
```
                         ┌──────────────┐
                         │    User      │
                         └──────┬───────┘
                                │
                                ↓
                    ┌─────────────────────┐
                    │      Next.js        │
                    │   TypeScript + UI   │
                    └──────────┬──────────┘
                               │
                         HTTP / REST
                               │
                               ↓
                    ┌─────────────────────┐
                    │       Go API        │
                    │                     │
                    │ Auth                │
                    │ Books               │
                    │ Search              │
                    │ Reviews             │
                    │ Library             │
                    │ Bookmarks           │
                    │ Progress            │
                    └──────────┬──────────┘
                               │
                               ↓
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    └─────────────────────┘
```

## 4. Frontend Architecture
The frontend uses the Next.js App Router.
Main routes:

```
/
├── books
│   └── [slug]
│
├── read
│   └── [slug]
│
├── categories
│   └── [slug]
│
├── topics
│   └── [slug]
│
├── authors
│   └── [slug]
│
├── login
├── signup
├── library
└── profile
```

Main frontend areas:
* `app/`
* `components/`
* `lib/`
* `hooks/`
* `types/`

Detailed frontend structure is defined in 06-FRONTEND.md.

## 5. Backend Architecture
The Go backend uses a layered structure:

```
HTTP Request
     ↓
Handler
     ↓
Service
     ↓
Repository
     ↓
PostgreSQL
```

### Handler
Responsible for:

* HTTP requests
* Parsing parameters
* Calling services
* Returning responses

### Service
Contains business logic.
Examples:

* Creating a user
* Authenticating a user
* Saving a book
* Rating a book
* Updating reading progress

### Repository
Responsible for database operations.
Example:

```
BookRepository
RatingRepository
ReviewRepository
UserRepository
```

This keeps HTTP logic separate from database logic.

## 6. Backend Modules
The backend should be organized around the application's main domains:

* auth
* users
* books
* authors
* categories
* topics
* reviews
* ratings
* library
* bookmarks
* progress

Not every module needs to become a separate complicated package. Small related functionality can be grouped where appropriate.

## 7. Request Flow
Example: getting a book.

```
Browser
   ↓
GET /api/v1/books/web-security-testing-guide
   ↓
Go Router
   ↓
Book Handler
   ↓
Book Service
   ↓
Book Repository
   ↓
PostgreSQL
   ↓
Repository
   ↓
Service
   ↓
Handler
   ↓
JSON Response
   ↓
Next.js
```

## 8. Authentication Architecture
HackShelf uses JWT authentication.

```
Signup/Login
     ↓
Go API
     ↓
Validate credentials
     ↓
Generate tokens
     ↓
Return authentication response
     ↓
Next.js
```

For protected requests:

```
Next.js
   ↓
Access JWT
   ↓
Go API
   ↓
Authentication Middleware
   ↓
Validate JWT
   ↓
Handler
```

Refresh tokens are used to obtain new access tokens when the access token expires.
Detailed authentication rules are defined in 07-SECURITY-DEPLOYMENT.md.

## 9. Book Architecture
Books consist primarily of metadata and a legitimate reading source.

```
Book
├── Metadata
│   ├── title
│   ├── description
│   ├── author
│   ├── level
│   ├── categories
│   └── topics
│
└── Content Source
    ├── Hosted chapter content (Markdown/HTML) — every cataloged book
    └── Official source URL (attribution metadata only)
```

Every cataloged book is hosted in-system and fully readable in the platform.
Books without redistribution rights (and without author permission) are excluded from the catalog and tracked in the wishlist for outreach.

## 10. Book Reading Flow
```
User
 ↓
Book Details
 ↓
Read Book
 ↓
Check reading source
 ↓
┌──────────────────────┐
│                      │
Hosted (all cataloged books)
│                      │
↓                      ↓
Internal Reader (full book, in-platform)
```

All cataloged books are hosted by HackShelf, so the reader always provides bookmarks and progress tracking.

## 11. Search Architecture
Search is handled by the Go API.

```
User enters search
        ↓
Next.js
        ↓
GET /api/v1/search?q=...
        ↓
Go API
        ↓
PostgreSQL search
        ↓
Filtered results
        ↓
Next.js
```

PostgreSQL full-text search should be used initially.
A dedicated search engine such as Elasticsearch is not required.

## 12. Ratings Architecture
Ratings belong to registered users.

```
User
 ↓
Rate Book
 ↓
POST /books/:id/rating
 ↓
Go API
 ↓
Validate user
 ↓
Create/update rating
 ↓
PostgreSQL
```

The book's average rating is calculated from user ratings.
Initial catalog ratings can be created using the project owner's account to provide realistic starting content.

## 13. Reviews Architecture
```
User
 ↓
Write Review
 ↓
POST /books/:id/reviews
 ↓
Authentication
 ↓
Validation
 ↓
Database
 ↓
Review displayed on book page
```

Each user can have only one active review for a particular book.

## 14. Personal Library Architecture
Saved books:

```
User
 ↓
Save Book
 ↓
saved_books
 ↓
My Library
```

Bookmarks:

```
User
 ↓
Bookmark
 ↓
bookmarks
 ↓
My Bookmarks
```

Reading progress:

```
User
 ↓
Read Book
 ↓
Update position
 ↓
reading_progress
 ↓
Continue Reading
```

## 15. Authorization
The backend determines whether an endpoint requires authentication.

### Public
* `GET /books`
* `GET /books/:slug`
* `GET /categories`
* `GET /authors/:slug`
* `GET /search`
* `GET /books/:id/reviews`

### Protected
* `POST /books/:id/rating`
* `POST /books/:id/reviews`
* `GET /me/library`
* `POST /me/library/:bookId`
* `GET /me/bookmarks`
* `POST /me/bookmarks`
* `GET /me/progress/:bookId`
* `PUT /me/progress/:bookId`

The backend MUST never rely solely on frontend restrictions for authorization.

## 16. Database Access
Only the Go backend communicates with PostgreSQL.

```
Next.js
   X
   │
   │ No direct database access
   │
Go API
   ↓
PostgreSQL
```

This keeps database credentials and business logic on the server.

## 17. Book Data Management
There is no admin interface.
Initial books are added through:

```
Database migrations
        OR
Seed scripts
```

Example:

```
cmd/
└── seed/
    └── main.go
```

The seed process creates:

* Books
* Authors
* Categories
* Topics
* Relationships
* Initial ratings/reviews where appropriate

After deployment, the catalog can be updated through seed/migration changes.

## 18. External Services
The system should minimize external dependencies.
Potential services:

* **Next.js** → Vercel
* **Go API** → Docker-based hosting
* **PostgreSQL** → Managed PostgreSQL
* **Book content** → Hosted chapter files in the platform (attribution link to official source only)

No external AI, search engine, payment provider, or analytics platform is required for the MVP.

## 19. Docker Architecture
Local development uses Docker Compose:

```
Docker Compose
│
├── frontend
│   └── Next.js
│
├── backend
│   └── Go API
│
└── postgres
    └── PostgreSQL
```

Production deployment may use separate managed services.

## 20. Error Handling
Errors should follow a consistent API format.
Example:

```json
{
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "Book not found"
  }
}
```

The backend should use appropriate HTTP status codes.
Examples:

* `400 Bad Request`
* `401 Unauthorized`
* `403 Forbidden`
* `404 Not Found`
* `409 Conflict`
* `422 Unprocessable Entity`
* `429 Too Many Requests`
* `500 Internal Server Error`

The frontend converts these responses into user-friendly messages.

## 21. Architecture Principles
HackShelf should follow these principles:

### Keep it simple
No unnecessary microservices or infrastructure.

### Separate responsibilities
Frontend, business logic, and database access remain separate.

### Backend owns business rules
Important validation and authorization happen in Go.

### Database integrity
Use foreign keys, constraints, and indexes where appropriate.

### Security by default
Protected resources require authentication and authorization.

### API-first communication
Next.js communicates with Go through the documented REST API.

### In-system book content
All cataloged books are served from hosted chapter files; the official source URL is displayed as attribution only, never as the reading path.

## 22. Final Architecture
```
                         HACKSHELF
                            │
              ┌─────────────┴─────────────┐
              │                           │
           PUBLIC                     AUTHENTICATED
              │                           │
       Browse/Search                 Save Books
       Filter/Sort                   Rate Books
       View Books                    Reviews
       Read Books                    Bookmarks
       Authors                       Progress
       Categories                    Library
              │                           │
              └─────────────┬─────────────┘
                            ↓
                       Next.js
                            ↓
                         REST API
                            ↓
                           Go
                            ↓
                       PostgreSQL
```

Architecture goal: keep the system as a straightforward Next.js → Go → PostgreSQL application, with external/authorized book sources, rather than introducing unnecessary complexity.