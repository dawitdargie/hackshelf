# --- Build stage ---
FROM golang:1.25-alpine AS builder

WORKDIR /src

# Cache dependencies separately from source changes.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Static binary so the runtime image needs no libc.
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

# --- Runtime stage ---
FROM alpine:3.20

RUN adduser -D -H -u 10001 appuser
USER appuser

COPY --from=builder /out/api /usr/local/bin/api

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/api"]
