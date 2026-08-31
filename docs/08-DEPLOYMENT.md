# HackShelf — Deployment & Operations

## 1. Deployment Overview

HackShelf consists of:

```
Next.js Frontend
        ↓
     Go API
        ↓
   PostgreSQL
```

Docker is used for local development and backend deployment consistency.

The production deployment should remain simple and inexpensive.

## 2. Recommended Production Setup

```
                    ┌───────────────┐
                    │    Users      │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │    Vercel     │
                    │    Next.js    │
                    └───────┬───────┘
                            ↓ HTTPS
                    ┌───────────────┐
                    │   Go API      │
                    │   Docker      │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │  PostgreSQL   │
                    └───────────────┘
```

The exact hosting providers can be changed later.

## 3. Frontend Deployment

The Next.js application should be deployed to a platform that supports Next.js well.

**Recommended:**

Vercel

The frontend deployment should configure:

```
NEXT_PUBLIC_API_URL=https://api.example.com
```

The frontend must never contain:

- `DATABASE_URL`
- `JWT_SECRET`

or any other backend secret.

## 4. Backend Deployment

The Go API should run as a Docker container.

**Example:**

```
Docker
   ↓
Go API
   ↓
Port 8080
```

The container should receive configuration through environment variables.

**Example:**

```
DATABASE_URL=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://example.com
```

## 5. PostgreSQL Deployment

Production PostgreSQL should preferably use a managed PostgreSQL provider.

**Requirements:**

- Automated backups
- Persistent storage
- Secure connection
- Database credentials stored as secrets
- Restricted network access

Do not use the development Docker PostgreSQL database as the production database.

## 6. Docker Compose — Development

Local development should use Docker Compose.

**docker-compose.yml**

```
services:
  frontend
  backend
  postgres
```

**Example architecture:**

```
┌─────────────────────────────┐
│       Docker Compose        │
│                             │
│  ┌─────────┐                │
│  │ Next.js │ :3000          │
│  └────┬────┘                │
│       │                     │
│  ┌────▼────┐                │
│  │ Go API  │ :8080          │
│  └────┬────┘                │
│       │                     │
│  ┌────▼──────┐              │
│  │ PostgreSQL│ :5432       │
│  └───────────┘              │
└─────────────────────────────┘
```

## 7. Docker Images

### Frontend

Use a multi-stage Docker build if the frontend is deployed through Docker.

```
Node
 ↓
Build Next.js
 ↓
Production image
```

### Backend

Use a multi-stage Go build:

```
Go image
 ↓
Build binary
 ↓
Minimal production image
 ↓
Run binary
```

The final backend image should contain only what is required to run the application.

## 8. Local Development

Developers should be able to start the complete system with:

```
docker compose up
```

This should start:

- Frontend → `localhost:3000`
- Backend  → `localhost:8080`
- Database → `localhost:5432`

The exact ports can be changed through configuration.

## 9. Environment Configuration

Use separate environments:

- `.env.example`
- `.env.local`
- production environment variables

Never commit actual production secrets.

**Example:**

```
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
FRONTEND_URL=
NEXT_PUBLIC_API_URL=
```

## 10. Database Migrations

Database schema changes must use migrations.

**Deployment flow:**

```
Build
 ↓
Deploy API
 ↓
Run migrations
 ↓
Start application
```

Never manually modify the production database for normal schema changes.

## 11. Initial Database Seeding

After the database is created:

```
Run migrations
      ↓
Create tables
      ↓
Run seed
      ↓
Insert:
  - Levels
  - Categories
  - Topics
  - Authors
  - 100 books
      ↓
Create initial ratings/reviews
```

Initial ratings/reviews should use the project owner's real account rather than fake accounts.

## 12. Production Deployment Flow

```
Developer
    ↓
Git push
    ↓
GitHub
    ↓
Frontend deployment
    ↓
Next.js deployed

GitHub
    ↓
Backend build
    ↓
Docker image
    ↓
Backend deployment
    ↓
Database migrations
```

The exact CI/CD implementation can remain simple.

A full Kubernetes setup is not required.

## 13. Domain Structure

**Recommended:**

- `www.example.com` for the frontend.
- `api.example.com` for the Go API.

Therefore:

```
https://www.example.com
        ↓
Next.js

https://api.example.com
        ↓
Go API
```

## 14. HTTPS

Production MUST use HTTPS.

```
Frontend → HTTPS
API      → HTTPS
Database → Secure connection
```

HTTP should redirect to HTTPS where supported.

## 15. CORS Configuration

The API should allow only the production frontend origin.

**Example:**

```
https://www.example.com
```

Development can allow:

```
http://localhost:3000
```

Do not allow all origins in production.

## 16. Database Backups

Production PostgreSQL should have automated backups enabled.

**Minimum goal:**

Daily backup

The exact retention period depends on the database provider.

For a portfolio project, an elaborate backup infrastructure is unnecessary.

## 17. Monitoring

Basic monitoring is enough.

**Monitor:**

- API availability
- HTTP errors
- Response time
- Database availability
- Container health

A full observability stack is not required.

## 18. Health Check

The Go API should expose:

```
GET /health
```

**Response:**

```json
{
  "status": "ok"
}
```

The endpoint should verify that the API itself is running.

A separate database health check can be used internally for deployment/container monitoring.

## 19. Logging

Production logs should include:

- Timestamp
- HTTP method
- Path
- Status
- Response time
- Error code

**Example:**

```
2026-08-15 14:20:31 GET /api/v1/books 200 42ms
```

Do not log:

- Passwords
- Access tokens
- Refresh tokens
- Database credentials

## 20. Docker Production Rules

Production containers should:

- Use minimal images
- Use multi-stage builds
- Avoid unnecessary packages
- Avoid running as root where practical
- Receive secrets through environment variables
- Expose only required ports
- Have health checks

## 21. Database Security in Production

PostgreSQL should not be directly accessible from the public internet unless absolutely necessary.

**Preferred:**

```
Internet
   ↓
Go API
   ↓
Private/secured database connection
   ↓
PostgreSQL
```

**Not:**

```
Internet
   ↓
PostgreSQL
```

## 22. Deployment Checklist

### Frontend

- [ ] Production build succeeds
- [ ] API URL configured
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] SEO metadata configured

### Backend

- [ ] Production build succeeds
- [ ] Docker image builds
- [ ] Environment variables configured
- [ ] CORS configured
- [ ] HTTPS configured
- [ ] Health endpoint works
- [ ] Logs work

### Database

- [ ] PostgreSQL created
- [ ] Migrations executed
- [ ] Seed data loaded
- [ ] Backups enabled
- [ ] Credentials secured

### Security

- [ ] JWT secrets are production secrets
- [ ] HTTPS enabled
- [ ] Secure cookies enabled
- [ ] Rate limiting enabled
- [ ] Production errors sanitized
- [ ] Database not publicly exposed

## 23. Deployment Architecture

Final production structure:

```
                         INTERNET
                             │
                             ↓
                    ┌─────────────────┐
                    │   Next.js       │
                    │   Frontend      │
                    │   Vercel        │
                    └────────┬────────┘
                             │
                          HTTPS
                             │
                             ↓
                    ┌─────────────────┐
                    │     Go API      │
                    │     Docker      │
                    └────────┬────────┘
                             │
                       Secure DB
                       Connection
                             │
                             ↓
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │ Managed DB      │
                    └─────────────────┘
```

## 24. What We Are NOT Building

To keep HackShelf appropriate for a portfolio project, do not add:

- Kubernetes
- Microservices
- Load-balancer clusters
- Redis unless actually needed
- Elasticsearch
- Message queues
- Complex CI/CD pipelines
- Separate admin infrastructure
- Self-hosted database servers
- Complex monitoring systems

The target architecture is simply:

**Next.js + Go + PostgreSQL + Docker**