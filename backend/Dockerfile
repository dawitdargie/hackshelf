# --- Build stage ---
FROM golang:1.25-alpine AS builder

WORKDIR /src

# Cache dependencies separately from source changes.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Static binaries so the runtime image needs no libc.
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/migrate ./cmd/migrate

# --- Runtime stage ---
FROM alpine:3.20

RUN adduser -D -H -u 10001 appuser
USER appuser

COPY --from=builder /out/api /usr/local/bin/api
COPY --from=builder /out/migrate /usr/local/bin/migrate
# The migrate binary resolves migrations relative to its working directory.
COPY --from=builder /src/migrations /app/migrations

WORKDIR /app

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/api"]
