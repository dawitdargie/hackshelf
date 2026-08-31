# HackShelf — REST API Specification

## 1. API Overview
The HackShelf backend exposes a REST API consumed by the Next.js frontend.

**Base URL:**
`/api/v1`

**Example:**
`GET /api/v1/books`

The API returns JSON responses.

---

## 2. API Conventions

### Request
Requests use:
`Content-Type: application/json`
unless the endpoint requires another format.

### Authentication
Protected endpoints require:
`Authorization: Bearer <access_token>`

### Success Response
Responses should use a consistent structure.

**Example:**
```json
{
  "data": {
    "id": "book-id",
    "title": "Example Book"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "Book not found"
  }
}
```

---

## 3. HTTP Status Codes
The API uses standard HTTP status codes:

| Status | Meaning |
| --- | --- |
| `200` | Successful request |
| `201` | Resource created |
| `204` | Successful request with no content |
| `400` | Invalid request |
| `401` | Authentication required/invalid |
| `403` | Forbidden |
| `404` | Resource not found |
| `409` | Conflict |
| `422` | Validation error |
| `429` | Too many requests |
| `500` | Internal server error |

---

## 4. Authentication

### Signup
`POST /api/v1/auth/signup`

#### Request
```json
{
  "username": "dawit",
  "email": "dawit@example.com",
  "password": "password"
}
```

#### Response
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "username": "dawit",
      "email": "dawit@example.com"
    },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

#### Errors
* `400` Invalid request
* `409` Email/username already exists
* `422` Invalid input

---

## 5. Login
`POST /api/v1/auth/login`

### Request
```json
{
  "email": "dawit@example.com",
  "password": "password"
}
```

### Response
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "username": "dawit",
      "email": "dawit@example.com"
    },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### Errors
* `401` Invalid credentials
* `422` Invalid input

---

## 6. Refresh Token
`POST /api/v1/auth/refresh`

### Request
```json
{
  "refresh_token": "..."
}
```

### Response
```json
{
  "data": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

An invalid or expired refresh token returns:
`401 Unauthorized`

---

## 7. Logout
`POST /api/v1/auth/logout`

**Authentication:** Required.

### Request
```json
{
  "refresh_token": "..."
}
```

The refresh token is revoked.

### Response
`204 No Content`

---

## 8. Current User
`GET /api/v1/me`

**Authentication:** Required.

### Response
```json
{
  "data": {
    "id": "uuid",
    "username": "dawit",
    "email": "dawit@example.com"
  }
}
```

---

## 9. Password Reset

### Request Password Reset
`POST /api/v1/auth/forgot-password`

#### Request
```json
{
  "email": "dawit@example.com"
}
```

The API should return a generic response regardless of whether the email exists.

### Reset Password
`POST /api/v1/auth/reset-password`

#### Request
```json
{
  "token": "...",
  "password": "new-password"
}
```

---

## 10. Books

### List Books
`GET /api/v1/books`

**Authentication:** Not required.

#### Query Parameters
* `page`
* `limit`
* `search`
* `level`
* `category`
* `topic`
* `rating`
* `sort`

**Example:**
`GET /api/v1/books?level=3&category=web-pentesting&sort=rating`

#### Response
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Example Book",
      "slug": "example-book",
      "cover_url": "...",
      "level": {
        "id": 3,
        "name": "Penetration Testing"
      },
      "rating": {
        "average": 4.7,
        "count": 12
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

## 11. Get Book
`GET /api/v1/books/:slug`

**Authentication:** Not required.

### Response
```json
{
  "data": {
    "id": "uuid",
    "title": "Example Book",
    "slug": "example-book",
    "description": "...",
    "cover_url": "...",
    "authors": [],
    "level": {},
    "categories": [],
    "topics": [],
    "source_url": "...",
    "license": "...",
    "rating": {
      "average": 4.7,
      "count": 12
    }
  }
}
```

---

## 11b. Book Chapters

All cataloged books are hosted in-system and read inside HackShelf. The reader fetches one chapter at a time.

### Chapter List (Table of Contents)
`GET /api/v1/books/:slug/chapters`

#### Response
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "introduction",
      "title": "Introduction",
      "chapter_order": 1
    }
  ]
}
```

### Chapter Content
`GET /api/v1/books/:slug/chapters/:chapterSlug`

#### Response
```json
{
  "data": {
    "id": "uuid",
    "slug": "introduction",
    "title": "Introduction",
    "chapter_order": 1,
    "content": "# Introduction\n\nChapter markdown content..."
  }
}
```

### Errors
* `404` Book or chapter not found

---

## 12. Search
Search can use the books endpoint:
`GET /api/v1/books?search=burp`

A separate search endpoint is not required unless implementation later benefits from one.
This keeps the API simpler.

---

## 13. Levels

### List Levels
`GET /api/v1/levels`

#### Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "Cybersecurity Basics",
      "slug": "cybersecurity-basics"
    }
  ]
}
```

### Get Level
`GET /api/v1/levels/:slug`

Returns level information and its books.

---

## 14. Categories

### List Categories
`GET /api/v1/categories`

### Get Category
`GET /api/v1/categories/:slug`

Returns category information and matching books.

---

## 15. Topics

### List Topics
`GET /api/v1/topics`

### Get Topic
`GET /api/v1/topics/:slug`

Returns topic information and matching books.

---

## 16. Authors

### List Authors
`GET /api/v1/authors`

Pagination MAY be used.

### Get Author
`GET /api/v1/authors/:slug`

Returns:
* Author information
* Author's books

---

## 17. Reviews

### Get Book Reviews
`GET /api/v1/books/:bookId/reviews`

**Authentication:** Not required.

#### Response
```json
{
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "username": "dawit"
      },
      "content": "Excellent resource.",
      "created_at": "2026-08-15T10:00:00Z"
    }
  ]
}
```

### Create Review
`POST /api/v1/books/:bookId/reviews`

**Authentication:** Required.

#### Request
```json
{
  "content": "Excellent resource."
}
```

#### Response
`201 Created`

A user can only have one review for a book.

### Update Review
`PUT /api/v1/reviews/:reviewId`

**Authentication:** Required.
The user can only update their own review.

#### Request
```json
{
  "content": "Updated review."
}
```

### Delete Review
`DELETE /api/v1/reviews/:reviewId`

**Authentication:** Required.
The user can only delete their own review.

#### Response
`204 No Content`

---

## 18. Ratings

### Get Book Rating
Rating information is included in:
`GET /api/v1/books/:slug`

No separate endpoint is required for normal book pages.

### Create/Update Rating
`PUT /api/v1/books/:bookId/rating`

**Authentication:** Required.

#### Request
```json
{
  "rating": 5
}
```

Valid values: `1`, `2`, `3`, `4`, `5`

If the user has no existing rating, it is created.
If one already exists, it is updated.

### Delete Rating
`DELETE /api/v1/books/:bookId/rating`

**Authentication:** Required.

#### Response
`204 No Content`

---

## 19. Saved Books

### Get Saved Books
`GET /api/v1/me/library`

**Authentication:** Required.

### Save Book
`POST /api/v1/me/library/:bookId`

**Authentication:** Required.

#### Response
`201 Created`

If already saved: `409 Conflict`

### Remove Saved Book
`DELETE /api/v1/me/library/:bookId`

**Authentication:** Required.

#### Response
`204 No Content`

---

## 20. Bookmarks

### Get Bookmarks
`GET /api/v1/me/bookmarks`

**Authentication:** Required.

### Get Bookmarks for a Book
`GET /api/v1/me/books/:bookId/bookmarks`

**Authentication:** Required.

### Create Bookmark
`POST /api/v1/me/books/:bookId/bookmarks`

#### Request
```json
{
  "location": "chapter-4-page-52",
  "note": "Important section about XSS."
}
```

### Delete Bookmark
`DELETE /api/v1/me/bookmarks/:bookmarkId`

**Authentication:** Required.

---

## 21. Reading Progress

### Get Progress
`GET /api/v1/me/books/:bookId/progress`

**Authentication:** Required.

#### Response
```json
{
  "data": {
    "location": "chapter-4-page-52",
    "percentage": 47.5
  }
}
```

### Update Progress
`PUT /api/v1/me/books/:bookId/progress`

**Authentication:** Required.

#### Request
```json
{
  "location": "chapter-4-page-52",
  "percentage": 47.5
}
```

### Delete Progress
`DELETE /api/v1/me/books/:bookId/progress`

**Authentication:** Required.

---

## 22. User Library Summary
`GET /api/v1/me/library`

The response SHOULD provide enough information for the frontend to display:
* Saved Books
* Currently Reading
* Reading Progress

Bookmarks can remain under their own endpoint.

---

## 23. Homepage Data
A separate complex homepage endpoint is not required.
The frontend can use existing endpoints:
* `GET /books?sort=rating`
* `GET /books?sort=newest`
* `GET /books?level=1`
* `GET /books?level=2`
* `GET /books?level=3`
* `GET /books?level=4`

This keeps the backend simpler.

---

## 24. Pagination
Book lists MUST be paginated.

Default:
* `page = 1`
* `limit = 20`

Maximum:
* `limit = 100`

Example:
`GET /api/v1/books?page=2&limit=20`

---

## 25. Book Filtering
Example:
```text
GET /api/v1/books
    ?level=3
    &category=web-pentesting
    &topic=xss
    &rating=4
```

Filters should be combinable.

---

## 26. Sorting
Supported values:
* `newest`
* `rating`
* `most-rated`

Example:
`GET /api/v1/books?sort=rating`

---

## 27. Authentication Rules

### Public endpoints
No access token required.
* `GET /books`
* `GET /books/:slug`
* `GET /levels`
* `GET /categories`
* `GET /topics`
* `GET /authors`
* `GET /reviews`
* `POST /auth/signup`
* `POST /auth/login`
* `POST /auth/refresh`

### Protected endpoints
Require a valid access token.
* `/me`
* `/me/library`
* `/me/bookmarks`
* `/me/progress`
* `ratings`
* `reviews`

---

## 28. Authorization Rules
The backend MUST verify ownership.

For example:
```text
User A
   ↓
DELETE /reviews/123
```

If review 123 belongs to User B:
`403 Forbidden`

The frontend must never be trusted to enforce ownership.

---

## 29. Validation
The API MUST validate:

* **Signup**
  * Valid email
  * Valid username
  * Password requirements

* **Login**
  * Required credentials

* **Rating**
  * 1 ≤ rating ≤ 5

* **Review**
  * Required content
  * Maximum length

* **Reading progress**
  * 0 ≤ percentage ≤ 100

* **Search/filter**
  * Valid level
  * Valid category
  * Valid topic
  * Valid sort option
  * Valid pagination values

---

## 30. API Versioning
All API endpoints use:
`/api/v1`

Example:
* `/api/v1/books`
* `/api/v1/auth/login`
* `/api/v1/me/library`

Future breaking changes can use:
`/api/v2`

---

## 31. Complete Endpoint List

```text
AUTH
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password

USER
GET    /me

BOOKS
GET    /books
GET    /books/:slug

LEVELS
GET    /levels
GET    /levels/:slug

CATEGORIES
GET    /categories
GET    /categories/:slug

TOPICS
GET    /topics
GET    /topics/:slug

AUTHORS
GET    /authors
GET    /authors/:slug

RATINGS
PUT    /books/:bookId/rating
DELETE /books/:bookId/rating

REVIEWS
GET    /books/:bookId/reviews
POST   /books/:bookId/reviews
PUT    /reviews/:reviewId
DELETE /reviews/:reviewId

LIBRARY
GET    /me/library
POST   /me/library/:bookId
DELETE /me/library/:bookId

BOOKMARKS
GET    /me/bookmarks
GET    /me/books/:bookId/bookmarks
POST   /me/books/:bookId/bookmarks
DELETE /me/bookmarks/:bookmarkId

PROGRESS
GET    /me/books/:bookId/progress
PUT    /me/books/:bookId/progress
DELETE /me/books/:bookId/progress
```

---

## 32. API Design Principles
* Use REST conventions.
* Use predictable URLs.
* Use standard HTTP methods.
* Return consistent JSON.
* Validate all incoming data.
* Never expose database errors directly.
* Protect authenticated endpoints.
* Verify resource ownership.
* Paginate collections.
* Keep endpoints focused.
* Avoid creating endpoints that duplicate existing functionality.

The API should remain small and straightforward, matching HackShelf's intentionally focused scope.