# HackShelf — Backend

Go REST API for HackShelf.

## Structure

```
backend/
├── cmd/
│   ├── api/       # API server entry point
│   ├── migrate/   # Database migration runner
│   └── seed/      # Seed data script
├── internal/
│   ├── config/    # Environment configuration
│   ├── database/  # Database connection pool
│   ├── http/      # HTTP server, router, middleware
│   ├── auth/      # Authentication module
│   ├── users/     # User module
│   ├── books/     # Books module
│   ├── authors/   # Authors module
│   ├── categories/# Categories module
│   ├── topics/    # Topics module
│   ├── reviews/   # Reviews module
│   ├── ratings/   # Ratings module
│   ├── library/   # Saved books module
│   ├── bookmarks/ # Bookmarks module
│   └── progress/  # Reading progress module
├── migrations/    # SQL migration files
├── seed/          # Seed data JSON files
├── go.mod
└── .env.example
```

## Development

Run the backend with Docker Compose:

```
docker compose up backend
```

Or run locally with Go:

```
go run cmd/api/main.go
```
