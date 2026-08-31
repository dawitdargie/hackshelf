# HackShelf — Security & Authentication

## 1. Security Overview

HackShelf uses:

- JWT authentication
- Access + refresh tokens
- Password hashing
- Request validation
- Authorization middleware
- Rate limiting
- Secure database access
- HTTPS in production

Security should remain simple and appropriate for the project's size.

## 2. Authentication Flow

```
Signup / Login
      ↓
Go API
      ↓
Validate credentials
      ↓
Generate access token
      ↓
Generate refresh token
      ↓
Client
```

For protected requests:

```
Next.js
   ↓
Access Token
   ↓
Go API
   ↓
JWT Middleware
   ↓
Validate Token
   ↓
Protected Handler
```

## 3. Password Security

Passwords MUST never be stored directly.

Use a strong password hashing algorithm such as:

**Argon2id**

```
password
   ↓
Argon2id
   ↓
password_hash
   ↓
PostgreSQL
```

Never store:

```
password = "mypassword123"
```

The backend should enforce reasonable password requirements.

## 4. JWT Tokens

HackShelf uses two tokens.

### Access Token

Used for API authentication.

- Short lifetime
- Recommended: **15 minutes**

### Refresh Token

Used to obtain a new access token.

- Longer lifetime
- Recommended: **7–30 days**

Exact expiration values should be configurable through environment variables.

## 5. Refresh Token Security

Refresh tokens should be:

- Cryptographically random
- Stored hashed in PostgreSQL
- Revocable
- Expirable
- Associated with a user

**Database:**

```
refresh_tokens
├── user_id
├── token_hash
├── expires_at
└── revoked_at
```

When logging out, the refresh token is revoked.

## 6. Token Storage

The preferred browser storage strategy is:

**Access token**  
Keep it in application memory where practical.

**Refresh token**  
Store it in a:

- HttpOnly
- Secure
- SameSite

cookie in production.

This prevents JavaScript from directly reading the refresh token.

Do not store long-lived refresh tokens in localStorage.

## 7. Authorization

Authentication answers:  
**Who is this user?**

Authorization answers:  
**Is this user allowed to perform this action?**

Example:

```
User A
   ↓
DELETE /reviews/123
   ↓
Does review 123 belong to User A?
   ↓
YES → Delete
NO  → 403 Forbidden
```

The backend MUST perform this check.

## 8. Public vs Protected Resources

### Public

Visitors can:

- Browse books
- Search
- Filter
- View book details
- View authors
- View categories
- View topics
- View reviews
- Read available books

### Protected

Login is required for:

- Save books
- Rate books
- Write reviews
- Edit reviews
- Delete reviews
- Create bookmarks
- Track reading progress
- View personal library
- View personal bookmarks

## 9. Input Validation

Every API input must be validated on the backend.

**Examples:**

| Field              | Rules                          |
|--------------------|--------------------------------|
| Rating             | 1–5 only                       |
| Reading progress   | 0–100                          |
| Review             | Not empty, Maximum allowed length |
| Signup             | Valid email, Valid username, Valid password |

Never trust frontend validation alone.

## 10. SQL Injection Protection

The Go backend MUST use parameterized queries or a safe database abstraction.

Never construct SQL like:

```sql
"SELECT * FROM books WHERE title = '" + userInput + "'"
```

Use parameters instead.

## 11. XSS Protection

User-generated content includes:

- Reviews
- Bookmark notes
- Usernames

The application must prevent malicious HTML/JavaScript from being rendered as executable content.

Reviews should be rendered as plain text unless a future requirement explicitly introduces sanitized rich text.

## 12. CSRF Protection

If authentication uses cookies, state-changing requests must have appropriate CSRF protection.

The implementation should use:

- SameSite cookies
- CSRF protection where required
- Strict origin checks where appropriate

The exact mechanism should be selected during implementation based on the final authentication architecture.

## 13. CORS

The Go API should only allow requests from the HackShelf frontend origin.

**Development example:**

```
http://localhost:3000
```

Production should use the actual frontend domain.

Do not use:

```
Access-Control-Allow-Origin: *
```

for authenticated production requests.

## 14. Rate Limiting

Rate limiting should protect endpoints vulnerable to abuse.

Especially:

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /reviews`
- `PUT /rating`

Login should have stricter limits than normal public book browsing.

## 15. Authentication Error Messages

Avoid revealing whether an account exists.

For example, password reset should respond generically:

> If an account exists for this email,  
> instructions have been sent.

This prevents account enumeration.

## 16. Secrets

Secrets MUST NOT be committed to Git.

**Examples:**

- `JWT_SECRET`
- `DATABASE_URL`
- EMAIL credentials

Use environment variables.

Example:

```
.env
```

and ensure it is included in:

```
.gitignore
```

Provide:

```
.env.example
```

with placeholder values.

## 17. Environment Variables

**Example:**

```
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES=
REFRESH_TOKEN_EXPIRES=
FRONTEND_URL=
```

Production secrets must be configured through the hosting platform's secret/environment-variable system.

## 18. HTTPS

Production traffic MUST use HTTPS.

```
User
 ↓
HTTPS
 ↓
Next.js
 ↓
HTTPS
 ↓
Go API
 ↓
Secure DB connection
 ↓
PostgreSQL
```

Never send authentication credentials over plain HTTP in production.

## 19. Security Headers

The frontend/backend deployment should use appropriate security headers, including where applicable:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`

Headers should be configured according to the final deployment architecture.

## 20. File and Book Content Security

HackShelf should not automatically download arbitrary files from user-provided URLs.

Book sources should be curated during catalog creation.

For cataloged books (all hosted in-system):

```
HackShelf
   ↓
Hosted chapter content (served by the API)
```

The application should not blindly fetch and process arbitrary remote files.

## 21. Database Security

PostgreSQL should:

- Use a dedicated application user
- Use a strong password
- Not be publicly exposed unnecessarily
- Use encrypted connections in production where supported
- Restrict access to trusted services

The frontend must never receive database credentials.

## 22. Error Handling

Production responses must never expose:

- SQL queries
- Stack traces
- Database credentials
- Internal filesystem paths
- JWT secrets
- Internal service information

Return safe errors:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong"
  }
}
```

Detailed errors should be logged server-side.

## 23. Logging

The backend should log useful operational information such as:

- Request method
- Request path
- Status code
- Response time
- Error code
- Authentication failures

Do NOT log:

- Passwords
- JWT tokens
- Refresh tokens
- Sensitive credentials

## 24. Account Security

Users should be able to:

- Log out
- Reset their password
- Revoke their refresh session through logout

A future version could support multiple sessions/devices, but this is not required for the MVP.

## 25. Review Security

Users can only:

- Create their own review
- Edit their own review
- Delete their own review

They cannot modify another user's review.

The same ownership principle applies to:

- Bookmarks
- Ratings
- Reading progress

## 26. Book Data Security

Because there is no admin dashboard:

- Books are not created through a public API.
- Books are seeded/updated through controlled development scripts.
- Public users cannot modify book metadata.
- Public users cannot modify categories, topics, levels, or authors.

This significantly reduces the attack surface.

## 27. Dependency Security

Dependencies should be kept reasonably up to date.

Before production deployment:

- Go dependencies
- Next.js dependencies
- npm dependencies
- Docker images

should be checked for known vulnerabilities.

Do not blindly upgrade major versions without testing.

## 28. Docker Security

Production containers should:

- Avoid running as root where practical
- Use minimal base images
- Keep secrets outside images
- Expose only required ports
- Avoid mounting unnecessary host directories

PostgreSQL should not be publicly exposed unless there is a specific requirement.

## 29. Security Checklist

Before deployment:

- [ ] Passwords hashed with Argon2id
- [ ] JWT secrets configured securely
- [ ] Refresh tokens hashed
- [ ] HTTPS enabled
- [ ] Secure cookies configured
- [ ] CORS restricted
- [ ] Rate limiting enabled
- [ ] Backend validation enabled
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection configured where required
- [ ] Secrets removed from repository
- [ ] Production error messages sanitized
- [ ] Database not publicly exposed
- [ ] Security headers configured
- [ ] Dependencies checked
- [ ] Docker containers hardened

## 30. Security Principle

HackShelf should follow:

> Secure by default, but don't over-engineer security for a small portfolio project.

The goal is to demonstrate that the application handles authentication, user data, and API access professionally without turning a simple bookstore into an unnecessarily complex security platform.