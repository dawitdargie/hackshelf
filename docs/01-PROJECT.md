# Hacker/Pentester Free Bookstore

## 1. Project Overview
Hacker/Pentester Free Bookstore is a focused online bookstore/library containing a curated collection of legally free cybersecurity, hacking, and penetration-testing books and long-form resources.
The platform allows anyone to discover and read books without an account. Registered users get additional personal features such as saving books, rating, reviewing, bookmarking, and tracking reading progress.
The catalog contains approximately 100 free books/resources, organized from cybersecurity fundamentals to advanced hacking.
The project is not an e-commerce store, learning platform, or bootcamp.

## 2. Goal
Build a polished, easy-to-use platform where hackers, penetration testers, and people interested in cybersecurity can quickly:

* Discover relevant free books.
* Search and filter the catalog.
* Read books online.
* Save interesting books.
* Rate and review books.
* Bookmark important locations.
* Continue reading from where they stopped.

## 3. Target Users

### Primary users
* Beginner cybersecurity enthusiasts
* Ethical hackers
* Penetration testers
* Bug bounty hunters
* Red teamers
* Security students
* Developers interested in security

### User types

#### Visitor
Does not have an account.
Can browse and read books.

#### Registered User
Has an account.
Can use personal features such as saved books, ratings, reviews, bookmarks, and reading progress.

#### Administrator
There is no admin interface.
The book catalog is maintained through database seed data/migrations.

## 4. Core Product Concept
The platform is organized around books, not courses.
The primary experience is:

```
Discover
   ↓
Search / Filter
   ↓
View Book
   ↓
Read
   ↓
Save / Rate / Review
   ↓
Bookmark / Track Progress
```

The catalog uses levels to make discovery easier:

```
Level 1
Cybersecurity Basics
        ↓
Level 2
Hacker Fundamentals
        ↓
Level 3
Penetration Testing
        ↓
Level 4
Advanced Hacking
```

These levels do not represent courses or required learning paths.

## 5. Book Catalog
The initial catalog should contain approximately 100 legally free books/resources.
Books should come from legitimate sources such as:

* Open-source books
* Creative Commons resources
* Public-domain resources
* Author-provided free books
* Open-access security publications
* Organizations providing free security guides

Each resource must have a clear source and licensing/availability status.

### Book information
Every book should have:

* Title
* Slug
* Description
* Cover
* Author
* Level
* Category
* Topics
* Rating
* Rating count
* Source URL
* Read URL
* License
* Publication date

## 6. Book Levels

### Level 1 — Cybersecurity Basics
Introduces fundamental concepts.
Categories may include:

* Cybersecurity Fundamentals
* Networking
* Linux
* Operating Systems
* Programming Fundamentals

### Level 2 — Hacker Fundamentals
Introduces common security and hacking concepts.
Categories may include:

* Reconnaissance
* OSINT
* Security Tools
* Web Fundamentals
* Kali Linux
* Security Concepts

### Level 3 — Penetration Testing
Focuses on practical penetration testing.
Categories may include:

* Web Pentesting
* Network Pentesting
* API Pentesting
* Vulnerability Assessment
* Burp Suite
* Nmap
* Metasploit
* Active Directory
* Wireless Security

### Level 4 — Advanced Hacking
Contains advanced offensive-security material.
Categories may include:

* Exploit Development
* Binary Exploitation
* Reverse Engineering
* Malware Analysis
* Privilege Escalation
* Red Teaming
* Advanced Web Exploitation
* Advanced Network Attacks

## 7. Core Features

### Public Features
Visitors can:

* Browse books
* Search books
* Filter books
* Sort books
* View book details
* Read books online
* Browse by level
* Browse by category
* Browse by topic
* View authors
* View ratings
* View reviews
* View related books

No account is required for these features.

### Registered User Features
Registered users can additionally:

* Save books
* View saved books
* Rate books
* Write reviews
* Edit their reviews
* Delete their reviews
* Bookmark book locations
* View bookmarks
* Save reading progress
* Continue reading from their previous position

## 8. Authentication
The application uses JWT authentication.
Users can:

* Sign up
* Log in
* Log out
* Refresh authentication
* Reset their password

Authentication is required only for personal features.
A visitor should never be forced to create an account just to browse or read a book.

## 9. Online Reader
Books/resources should be readable directly from the platform when legally possible.
The reader should provide:

* Table of contents
* Chapter navigation
* Previous/next navigation
* Search within the book
* Font-size controls
* Light/dark reading mode
* Fullscreen mode
* Bookmarks
* Reading progress

A resource that cannot legally be hosted (no redistribution license and no author permission) is NOT included in the catalog; it may be tracked in the wishlist for future author-permission outreach.

## 10. Search and Discovery
Users should be able to search using:

* Book title
* Author
* Description
* Category
* Topic

Example:

`burp suite`

can return books related to:

* Burp Suite
* Web Security
* Web Pentesting
* XSS
* SQL Injection

### Filters
Users can filter by:

* Level
* Category
* Topic
* Rating

### Sorting
Users can sort by:

* Newest
* Highest rated
* Most rated

## 11. User Library
Registered users have a personal library.
The library contains:

### Saved Books
Books the user wants to keep for later.

### Currently Reading
Books with saved reading progress.

### Bookmarks
Specific locations saved inside books.

The library should remain simple and focused on books.

## 12. Ratings and Reviews
Users can give a book a rating from 1–5 stars.
The book page displays:

```
4.8 ★★★★★
324 ratings
```

Registered users can:

* Add a rating
* Change their rating
* Write a review
* Edit their review
* Delete their review

A user should have only one active rating/review per book.

## 13. Recommendations
The platform provides simple book recommendations.
Recommendations can be based on:

* Same category
* Same level
* Shared topics

Example:

```
You may also like

[Web Pentesting Book]
[Burp Suite Book]
[Web Security Book]
```

No AI recommendation system is required.

## 14. Free Resource Policy
The platform focuses exclusively on legally free resources, and every cataloged book is fully readable inside the platform.
A book is only included when its license explicitly allows redistribution (open-source, Creative Commons, public domain) or its author grants written permission.
Every book must have:

* Source
* License / availability information
* Hosted chapter content served by the platform (no external reading redirect)
* Official source shown as attribution only

The project must not distribute unauthorized copies of copyrighted books.

## 15. Design Direction
The interface should feel like a premium technical bookstore, with a subtle hacker/security aesthetic.

### Desired style

* Dark-first design
* Clean and modern
* Technical typography
* Strong book covers
* Subtle terminal/security influences
* Good spacing
* Responsive design
* Minimal visual clutter

Avoid excessive hacker clichés such as:

* Matrix rain everywhere
* Constant terminal animations
* Skulls
* Excessive neon effects

The focus should remain on books and usability.

## 16. Technology Stack

### Frontend
* Next.js
* TypeScript
* Tailwind CSS
* TanStack Query
* React Hook Form
* Zod

### Backend
* Go
* REST API
* JWT authentication

### Database
* PostgreSQL

### Infrastructure
* Docker
* Docker Compose for local development

### Deployment
* Next.js → Vercel
* Go API → Docker-based hosting such as Render
* PostgreSQL → managed PostgreSQL such as Neon
* Book content → hosted chapter files (Markdown/HTML) in the platform, only for books with redistribution rights or author permission

## 17. High-Level Architecture
```
                    User
                     │
                     ↓
              ┌─────────────┐
              │   Next.js   │
              │ TypeScript  │
              │  Tailwind   │
              └──────┬──────┘
                     │
                  REST API
                     │
                     ↓
              ┌─────────────┐
              │     Go      │
              │   Backend   │
              └──────┬──────┘
                     │
                     ↓
              ┌─────────────┐
              │ PostgreSQL  │
              └─────────────┘
                     │
                     ↓
              Book metadata
              User data
              Reviews
              Progress
```

Book content is served from:

```
Hosted chapter content (Markdown/HTML) stored by the platform
Attribution link to the official source (never the reading path)
```

## 18. Project Scope

### Included

* ~100 free books/resources
* Book discovery
* Search
* Filtering
* Sorting
* Online reading
* Authentication
* Saved books
* Ratings
* Reviews
* Bookmarks
* Reading progress
* User library
* Simple recommendations
* Responsive UI
* Docker
* Production deployment

### Explicitly Not Included

* ❌ Paid books
* ❌ Shopping cart
* ❌ Payments
* ❌ E-commerce
* ❌ Courses
* ❌ Lessons
* ❌ Quizzes
* ❌ Certificates
* ❌ Learning paths
* ❌ AI tutor
* ❌ AI recommendations
* ❌ Social network
* ❌ Admin dashboard
* ❌ Complex content management system
* ❌ Gamification

## 19. Success Criteria
The project is successful when a visitor can:

```
Open website
    ↓
Find a book
    ↓
Filter/search
    ↓
View its details
    ↓
Read it
```

And a registered user can:

```
Create account
    ↓
Save books
    ↓
Read books
    ↓
Bookmark locations
    ↓
Track progress
    ↓
Rate/review books
    ↓
Return to their library
```

The final product should feel like a real, focused free cybersecurity bookstore, rather than a collection of unrelated features.