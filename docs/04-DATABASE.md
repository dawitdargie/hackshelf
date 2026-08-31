# HackShelf — Database Design

## 1. Database
HackShelf uses PostgreSQL.
The database stores:

* Users
* Books
* Authors
* Levels
* Categories
* Topics
* Ratings
* Reviews
* Saved books
* Bookmarks
* Reading progress
* Refresh tokens

---

## 2. Entity Relationship Overview

```text
users ───────────────┐
  │                  │
  ├── ratings ───────┼── books
  ├── reviews ───────┤    │
  ├── saved_books ───┤    ├── authors
  ├── bookmarks ─────┤    ├── levels
  └── progress ──────┘    ├── categories
                           └── topics
```

Many-to-many relationships are handled through junction tables.

---

## 3. Users
Stores registered users.

### `users`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL |
| `password_hash` | TEXT | NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

**Notes**
* Passwords are stored only as secure hashes.
* Email and username must be unique.
* Users do not have admin roles because there is no admin system.

---

## 4. Refresh Tokens
Stores refresh-token sessions.

### `refresh_tokens`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `token_hash` | TEXT | UNIQUE, NOT NULL |
| `expires_at` | TIMESTAMP | NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL |
| `revoked_at` | TIMESTAMP | NULL |

Refresh tokens should be stored hashed rather than as plaintext.

---

## 5. Authors
Stores book authors.

### `authors`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `name` | VARCHAR(255) | NOT NULL |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL |
| `bio` | TEXT | NULL |
| `created_at` | TIMESTAMP | NOT NULL |

One author can have multiple books.

---

## 6. Levels
Stores the four book levels.

### `levels`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | SMALLINT | PK |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL |
| `description` | TEXT | NULL |
| `sort_order` | SMALLINT | UNIQUE, NOT NULL |

Initial levels:
* `1` → Cybersecurity Basics
* `2` → Hacker Fundamentals
* `3` → Penetration Testing
* `4` → Advanced Hacking

`sort_order` determines their display order.

---

## 7. Books
Stores the primary book information.

### `books`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `title` | VARCHAR(500) | NOT NULL |
| `slug` | VARCHAR(500) | UNIQUE, NOT NULL |
| `description` | TEXT | NOT NULL |
| `cover_url` | TEXT | NULL |
| `level_id` | SMALLINT | FK → levels |
| `source_url` | TEXT | NOT NULL |
| `read_url` | TEXT | NULL (legacy — unused by the reader; content is hosted via `chapters`) |
| `license` | VARCHAR(255) | NULL |
| `publication_date` | DATE | NULL |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

### chapters

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `book_id` | UUID | NOT NULL, FK → books(id) ON DELETE CASCADE |
| `slug` | TEXT | NOT NULL (unique per book) |
| `title` | TEXT | NOT NULL |
| `chapter_order` | INT | NOT NULL (1-based ordering) |
| `content` | TEXT | NOT NULL (Markdown/HTML of the chapter) |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default NOW() |

* UNIQUE(`book_id`, `slug`) and UNIQUE(`book_id`, `chapter_order`)
* Index on (`book_id`, `chapter_order`) — the TOC and chapter-by-order queries are the hot path (one chapter fetched per reader request)

**Book source**
* `source_url` points to the legitimate source of the book (attribution only).
* Reading happens inside the platform via hosted chapter content (see `chapters` below).
* A book is cataloged only if its license permits redistribution or its author grants permission.

---

## 8. Book ↔ Author
A book can have multiple authors, and an author can write multiple books.

### `book_authors`

| Column | Type | Constraints |
| --- | --- | --- |
| `book_id` | UUID | FK → books |
| `author_id` | UUID | FK → authors |

**Primary key:**
* `(book_id, author_id)`

---

## 9. Categories
Stores broad book categories.

### `categories`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL |
| `description` | TEXT | NULL |

Examples:
* Networking
* Linux
* Web Pentesting
* OSINT
* Burp Suite
* Reverse Engineering
* Exploit Development

---

## 10. Book ↔ Category
A book can belong to multiple categories.

### `book_categories`

| Column | Type | Constraints |
| --- | --- | --- |
| `book_id` | UUID | FK → books |
| `category_id` | UUID | FK → categories |

**Primary key:**
* `(book_id, category_id)`

---

## 11. Topics
Stores more specific subjects.

### `topics`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL |

Examples:
* SQL Injection
* XSS
* Nmap
* Metasploit
* Active Directory
* Privilege Escalation
* Kali Linux

---

## 12. Book ↔ Topic
A book can cover multiple topics.

### `book_topics`

| Column | Type | Constraints |
| --- | --- | --- |
| `book_id` | UUID | FK → books |
| `topic_id` | UUID | FK → topics |

**Primary key:**
* `(book_id, topic_id)`

---

## 13. Ratings
Stores user ratings.

### `ratings`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `book_id` | UUID | FK → books |
| `rating` | SMALLINT | 1–5 |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

**Unique constraint:**
* `(user_id, book_id)`

A user can rate a particular book only once. They can update that rating later.

---

## 14. Rating Calculation
Ratings should not be stored as a manually maintained value on books. Calculate them from ratings.

Example:
* Ratings: 5, 5, 4, 5, 4
* Average = 4.6
* Count = 5

The API can return:

```json
{
  "average": 4.6,
  "count": 5
}
```

For a newly added book:
* `average = null`
* `count = 0`

Once you seed ratings using your own account, the book will naturally have a rating.

---

## 15. Reviews
Stores user reviews.

### `reviews`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `book_id` | UUID | FK → books |
| `content` | TEXT | NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

**Unique constraint:**
* `(user_id, book_id)`

A user can have only one active review for a book.

---

## 16. Saved Books
Stores books saved by users.

### `saved_books`

| Column | Type | Constraints |
| --- | --- | --- |
| `user_id` | UUID | FK → users |
| `book_id` | UUID | FK → books |
| `created_at` | TIMESTAMP | NOT NULL |

**Primary key:**
* `(user_id, book_id)`

This prevents duplicate saves.

---

## 17. Bookmarks
Stores user bookmarks inside books.

### `bookmarks`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `book_id` | UUID | FK → books |
| `location` | TEXT | NOT NULL |
| `note` | TEXT | NULL |
| `created_at` | TIMESTAMP | NOT NULL |

`location` represents the reader position. The exact format depends on how the reader stores its content.

---

## 18. Reading Progress
Stores the user's current position in a book.

### `reading_progress`

| Column | Type | Constraints |
| --- | --- | --- |
| `user_id` | UUID | FK → users |
| `book_id` | UUID | FK → books |
| `location` | TEXT | NOT NULL |
| `percentage` | NUMERIC(5,2) | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

**Primary key:**
* `(user_id, book_id)`

A user has one current reading position per book.

---

## 19. Complete Relationship Diagram

```text
                         ┌──────────────┐
                         │    users     │
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ↓                 ↓                 ↓
        refresh_tokens       ratings           reviews
                                │                 │
                                └────────┬────────┘
                                         │
                                         ↓
                                  ┌──────────────┐
                                  │    books     │
                                  └──────┬───────┘
                                         │
                ┌────────────────────────┼────────────────────┐
                │                        │                    │
                ↓                        ↓                    ↓
          book_authors            book_categories        book_topics
                │                        │                    │
                ↓                        ↓                    ↓
             authors                 categories            topics

users ─────── saved_books ─────── books

users ─────── bookmarks ────────── books

users ─────── reading_progress ─── books

books ─────── levels
```

---

## 20. Foreign Key Behavior
Relationships should use appropriate foreign-key actions.

**Recommended:**

* **User deletion:** User-owned data should normally be deleted with the user:
  * `users` → `ratings`, `reviews`, `saved_books`, `bookmarks`, `reading_progress`, `refresh_tokens`
  * Use `ON DELETE CASCADE` where appropriate.

* **Book deletion:** Book-related data should be removed when a book is deleted:
  * `books` → `ratings`, `reviews`, `saved_books`, `bookmarks`, `reading_progress`, `book_authors`, `book_categories`, `book_topics`
  * Use `ON DELETE CASCADE` where appropriate.

* **Author/category/topic deletion:** Junction records should be removed, but the associated book should remain.

---

## 21. Indexes
Indexes should be created for frequently queried fields.

**Important indexes include:**
* `users.email`
* `users.username`
* `books.slug`
* `books.level_id`
* `books.created_at`
* `authors.slug`
* `categories.slug`
* `topics.slug`
* `ratings.book_id`
* `ratings.user_id`
* `reviews.book_id`
* `reviews.user_id`
* `saved_books.user_id`
* `saved_books.book_id`
* `bookmarks.user_id`
* `bookmarks.book_id`
* `reading_progress.user_id`
* `reading_progress.book_id`

Search-related indexes should also be added for the PostgreSQL search strategy chosen during implementation.

---

## 22. Seed Data
The initial database should contain:
* 4 levels
* ~100 books
* Authors
* Categories
* Topics
* Book relationships
* Initial ratings/reviews where appropriate

The initial ratings/reviews can be created using the project owner's registered account. The seed process MUST NOT create fake users simply to make the platform appear populated.

---

## 23. Data Rules

* **Books**
  * Title is required.
  * Slug is unique.
  * Every book must have a legitimate source.
  * Every book must belong to one level.
  * Every book must have at least one author.
  * Every book should have at least one category.

* **Ratings**
  * Rating must be between 1 and 5.
  * One rating per user/book.
  * Rating can be updated.

* **Reviews**
  * Review belongs to one user and one book.
  * One review per user/book.
  * Review content cannot be empty.

* **Saved Books**
  * One save per user/book.

* **Reading Progress**
  * One progress record per user/book.
  * Percentage must be between 0 and 100.

---

## 24. Database Migration Strategy
Database structure should be managed through versioned migrations.

Example:

```text
migrations/
├── 001_create_users.sql
├── 002_create_authors.sql
├── 003_create_levels.sql
├── 004_create_books.sql
├── 005_create_categories.sql
├── 006_create_topics.sql
├── 007_create_ratings.sql
├── 008_create_reviews.sql
├── 009_create_saved_books.sql
├── 010_create_bookmarks.sql
├── 011_create_reading_progress.sql
└── 012_create_refresh_tokens.sql
```

The exact migration tooling will be selected during implementation.

---

## 25. Database Principles
HackShelf database design should follow these principles:

* Use PostgreSQL constraints to protect data integrity.
* Keep relationships normalized.
* Avoid duplicating calculated data unnecessarily.
* Use UUIDs for primary identifiers.
* Use foreign keys for relationships.
* Add indexes based on actual query requirements.
* Never store plaintext passwords.
* Never store plaintext refresh tokens.
* Keep book metadata separate from book content.

---

## Final Database Structure
* `users`
* `refresh_tokens`
* `books`
* `authors`
* `levels`
* `categories`
* `topics`
* `book_authors`
* `book_categories`
* `book_topics`
* `ratings`
* `reviews`
* `saved_books`
* `bookmarks`
* `reading_progress`

This is enough for the complete HackShelf MVP without introducing unnecessary tables or database complexity.