
The actual structure can be adjusted during implementation.

## 35. TypeScript Types

Frontend types should reflect API contracts.

Examples:

- User
- Book
- Author
- Level
- Category
- Topic
- Rating
- Review
- Bookmark
- ReadingProgress
- Pagination
- ApiError

Types should be centralized where practical.

## 36. Authentication State

The frontend must know whether the user is:

- Unauthenticated
- Authenticated
- Loading authentication state

Protected pages such as `/library` should redirect unauthenticated users to `/login`. Public pages must remain accessible without authentication.

## 37. SEO

Public book content should be SEO-friendly.

Important pages:

- Homepage
- Books
- Individual books
- Authors
- Categories
- Topics
- Levels

Book pages should have appropriate:

- Title
- Description
- Open Graph metadata
- Canonical URL

Private pages do not need to be indexed.

## 38. Accessibility

The frontend SHOULD follow accessible UI practices:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Accessible forms
- Proper labels
- Sufficient contrast
- Alt text for book covers
- Screen-reader-friendly controls

The reader should also be keyboard-friendly.

## 39. Performance

The frontend should:

- Optimize images
- Lazy-load where appropriate
- Paginate book lists
- Avoid unnecessary API requests
- Cache server data
- Use appropriate Next.js rendering strategies
- Debounce search requests

The reader should not load an entire large book unnecessarily.

## 40. Animation

Animation should be subtle and purposeful.

Good uses:

- Page transitions
- Book-card hover
- Save button feedback
- Filter transitions
- Reader controls

Avoid animations that interfere with reading or navigation.

## 41. Frontend Principles

**Book-first** — The books are the primary product.

**Simple navigation** — Users should reach a book within a few interactions.

**Public-first** — Visitors should get substantial value without creating an account.

**Responsive** — Mobile is a first-class experience.

**Reusable** — Repeated UI should use reusable components.

**Accessible** — Core features must remain usable without a mouse.

**Minimal complexity** — Do not introduce frontend libraries unless they solve an actual requirement.

## 42. Frontend Completion Criteria

The frontend is complete when users can:

### Visitors

- Browse books
- Search
- Filter
- Sort
- View details
- Read books
- View reviews

### Registered users

- Signup
- Login
- Save books
- Rate books
- Review books
- Bookmark content
- Track reading progress
- Use library
- Logout

And the entire interface is:

- Responsive
- Accessible
- Consistent
- Connected to the Go API
- Properly handles loading/error/empty states
- Production-ready

The frontend should feel like a polished specialized bookstore first, with the cybersecurity aesthetic supporting the product rather than overwhelming it.