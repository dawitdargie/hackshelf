# HackShelf — System Requirements

## 1. Purpose
This document defines the functional and non-functional requirements for HackShelf.
HackShelf is a free online bookstore/library for hackers and penetration testers. It provides a curated collection of legally free cybersecurity books and resources.

## 2. User Types

### Visitor
A user without an account.
Can discover and read books but cannot use personal features.

### Registered User
A user with an account.
Can use personal library and interaction features.

### System Maintainer
There is no admin dashboard. Books are managed through seed data/database migrations.

## 3. Public Requirements
Visitors MUST be able to:

* View the homepage.
* Browse all books.
* Search books.
* Filter books.
* Sort books.
* Browse by level.
* Browse by category.
* Browse by topic.
* View book details.
* View author information.
* Read available books.
* View ratings and reviews.
* View related books.

Registration MUST NOT be required to browse or read publicly available books.

## 4. Homepage Requirements
The homepage MUST provide:

* Project introduction.
* Main search bar.
* Link to browse all books.
* Featured books.
* Popular/highly rated books.
* Recently added books.
* Books grouped by level.
* Clear navigation to the catalog.

## 5. Book Requirements
Every book MUST have:

* Title
* Slug
* Description
* Cover
* Author
* Level
* Category
* Topics
* Source
* License/availability information
* Reading URL
* Rating information

### Optional metadata:
* Publication date
* Publisher
* ISBN
* Number of pages

A book MUST have a valid legitimate source.

## 6. Book Levels
Books MUST belong to one of four levels:

* **Level 1** — Cybersecurity Basics
* **Level 2** — Hacker Fundamentals
* **Level 3** — Penetration Testing
* **Level 4** — Advanced Hacking

Levels are used for catalog organization only.
The system MUST NOT treat levels as mandatory courses or learning paths.

## 7. Search Requirements
Users MUST be able to search by:

* Book title
* Author
* Description
* Topic

Search MUST support partial/keyword matching.

**Example:**
`burp`

should find books containing relevant Burp Suite content.
If no results are found, the interface MUST clearly display an empty state.

## 8. Filtering Requirements
Users MUST be able to filter books by:

* Level
* Category
* Topic
* Rating

Multiple filters SHOULD be combinable.

**Example:**
```
Level: 3
Category: Web Pentesting
Rating: 4+
```

The results should update without requiring unnecessary navigation.

## 9. Sorting Requirements
Users MUST be able to sort results by:

* Newest
* Highest rated
* Most rated

A default sorting option MUST be provided.

## 10. Book Details Requirements
The book details page MUST display:

* Cover
* Title
* Author
* Description
* Level
* Categories
* Topics
* Rating
* Number of ratings
* Source
* License/availability
* Table of contents when available
* Read button

It SHOULD also display:

* Related books
* Reviews
* Author information

## 11. Reader Requirements
Visitors MUST be able to read books without registering when the resource is publicly accessible.
The reader SHOULD provide:

* Table of contents
* Chapter navigation
* Previous/next navigation
* Search within the book
* Font-size control
* Light/dark reading mode
* Fullscreen mode

Registered users additionally get:

* Bookmarks
* Reading progress

All cataloged books MUST be fully readable inside the platform (hosted chapter content). Only books whose license permits redistribution — or whose author grants written permission — may be included. The reader MUST NOT send users to an external source to read; the official source is shown as attribution only. Books pending permission are kept out of the catalog until approved.

## 12. Authentication Requirements
The system MUST support:

### Signup
Users provide:
* Email
* Password
* Username/display name

### Login
Users authenticate using their credentials.

### Logout
The current authenticated session MUST be invalidated appropriately.

### Token Management
The system MUST use:
* Short-lived access JWT
* Refresh token

### Password Recovery
Users MUST be able to request a password reset.
Passwords MUST never be stored in plaintext.

## 13. Saved Books Requirements
Authenticated users MUST be able to:

* Save a book.
* Remove a saved book.
* View all saved books.

A user MUST NOT have duplicate saved entries for the same book.
Visitors attempting to save a book SHOULD be prompted to log in.

## 14. Rating Requirements
Authenticated users MUST be able to rate books from:

* 1 → 5 stars

A user can have only one active rating per book.
Users MUST be able to change their rating.
Book ratings MUST be calculated from user ratings.
The system SHOULD display:

* Average rating
* Total rating count
* Rating distribution when appropriate

## 15. Review Requirements
Authenticated users MUST be able to:

* Create a review.
* Edit their review.
* Delete their review.

A user can have only one active review per book.
Visitors can read existing reviews.
Reviews SHOULD display:

* Username/display name
* Rating
* Review text
* Date

## 16. Bookmark Requirements
Authenticated users MUST be able to bookmark a location inside a book.
A bookmark SHOULD contain:

* Book
* Chapter
* Page/location
* Optional note
* Created date

Users MUST be able to:

* Create bookmark
* View bookmarks
* Delete bookmark

## 17. Reading Progress Requirements
Authenticated users MUST be able to save their reading position.
The system SHOULD store:

* Book
* Current page/location
* Reading percentage
* Last read time

When returning to a book, the user SHOULD be able to continue from their previous position.

## 18. My Library Requirements
Authenticated users MUST have a library containing:

### Saved Books
Books they saved.

### Currently Reading
Books with reading progress.

### Bookmarks
Their saved reading locations.

The library MUST NOT contain course/learning-management functionality.

## 19. Recommendations
The system SHOULD provide simple recommendations.
Recommendations MAY use:

* Same level
* Same category
* Shared topics

The system MUST NOT require AI for recommendations.

## 20. Author Requirements
Users MUST be able to view an author's information and books.
An author page SHOULD contain:

* Author name
* Biography when available
* Author-related books

## 21. Category and Topic Requirements
Users MUST be able to browse books by:

* Level
* Category
* Topic

Each category/topic page SHOULD show:

* Name
* Description when available
* Matching books
* Result count

## 22. Free Resource Requirements
Every resource MUST be legitimately free to access.
The system MUST record the source.
The system MUST NOT knowingly host unauthorized copyrighted material.
A resource should have one of the following:

* Authorized hosted copy
* Hosted chapter content (full book readable in-platform)
* Open-access source
* Appropriate open license
* Author-provided free access

## 23. Error & Empty States
The application MUST handle:

* Book not found
* Author not found
* Category not found
* Search with no results
* Invalid filters
* Unauthorized requests
* Expired authentication
* Invalid login
* Duplicate rating
* Duplicate review
* Network/API failure
* Reader unavailable

Users should receive clear messages rather than raw technical errors.

## 24. Responsive Requirements
The application MUST work on:

* Desktop
* Tablet
* Mobile

Core functionality MUST remain usable on small screens, especially:

* Search
* Book browsing
* Book details
* Reader
* Login/signup
* Library

## 25. Security Requirements
The system MUST:

* Hash passwords securely.
* Validate user input.
* Protect authenticated endpoints.
* Validate JWTs.
* Protect refresh tokens.
* Prevent SQL injection.
* Apply appropriate CORS rules.
* Rate-limit sensitive endpoints.
* Avoid exposing secrets.
* Validate authorization on every protected resource.

Detailed security requirements are defined in `07-SECURITY-DEPLOYMENT.md`.

## 26. Performance Requirements
The application SHOULD:

* Load public book pages quickly.
* Paginate large book lists.
* Avoid loading the entire catalog at once.
* Optimize book covers.
* Cache appropriate public data.
* Use database indexes for frequent searches and filters.

## 27. Scope Restrictions
The following are explicitly outside the system:

* Paid books
* Shopping cart
* Payments
* E-commerce
* Courses
* Lessons
* Quizzes
* Certificates
* Learning paths
* AI tutor
* AI recommendations
* Social networking
* Gamification
* Admin dashboard
* Complex CMS

## 28. Core User Flows

### Visitor reads a book
```
Homepage
   ↓
Search/Browse
   ↓
Book
   ↓
Book Details
   ↓
Read
```

### User saves a book
```
Book
   ↓
Save
   ↓
Login/Signup
   ↓
Book Saved
   ↓
My Library
```

### User reviews a book
```
Book
   ↓
Rate / Review
   ↓
Login if necessary
   ↓
Submit
   ↓
Review displayed
```

### User continues reading
```
Library
   ↓
Currently Reading
   ↓
Book
   ↓
Continue from saved position
```

## 29. Definition of Done
The MVP is considered complete when:

* ~100 legitimate free books/resources are available.
* Visitors can browse, search, filter, and read.
* Book details are complete.
* Signup/login works.
* JWT authentication works.
* Users can save books.
* Users can rate and review.
* Users can bookmark reading locations.
* Reading progress is saved.
* My Library works.
* The application is responsive.
* Core errors are handled.
* The application is secured.
* Docker development environment works.
* Production deployment works.

This document defines what HackShelf must do. The next documents will define how those requirements are technically implemented.