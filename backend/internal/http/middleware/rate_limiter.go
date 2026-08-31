package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"
)

// rateLimiter tracks request timestamps per IP.
type rateLimiter struct {
	mu         sync.Mutex
	requests   map[string][]time.Time
	authLimit  int           // Max auth requests per window
	authWindow time.Duration // Auth rate limit window
	genLimit   int           // Max general requests per window
	genWindow  time.Duration // General rate limit window
}

// NewRateLimiter creates a new rate limiter.
func NewRateLimiter(authLimit, genLimit int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		requests:   make(map[string][]time.Time),
		authLimit:  authLimit,
		authWindow: window,
		genLimit:   genLimit,
		genWindow:  window,
	}
}

// allow checks if a request from the given IP is allowed.
func (rl *rateLimiter) allow(ip string, isAuth bool) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	limit := rl.genLimit
	window := rl.genWindow

	if isAuth {
		limit = rl.authLimit
		window = rl.authWindow
	}

	// Clean up timestamps older than the window.
	timestamps := rl.requests[ip]
	valid := timestamps[:0]
	for _, t := range timestamps {
		if now.Sub(t) < window {
			valid = append(valid, t)
		}
	}

	if len(valid) >= limit {
		rl.requests[ip] = valid
		return false
	}

	rl.requests[ip] = append(valid, now)
	return true
}

// isAuthPath checks if the path is a rate-limited auth endpoint.
func isAuthPath(path string) bool {
	authPaths := []string{
		"/api/v1/auth/login",
		"/api/v1/auth/signup",
		"/api/v1/auth/forgot-password",
		"/api/v1/auth/reset-password",
	}
	for _, p := range authPaths {
		if strings.HasPrefix(path, p) {
			return true
		}
	}
	return false
}

// RateLimit is middleware that limits requests per IP.
func RateLimit(authLimit, genLimit int, window time.Duration) func(http.Handler) http.Handler {
	rl := NewRateLimiter(authLimit, genLimit, window)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r)
			if !rl.allow(ip, isAuthPath(r.URL.Path)) {
				WriteError(w, http.StatusTooManyRequests, "RATE_LIMITED", "Too many requests")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// clientIP extracts the client IP from the request.
func clientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (production behind proxy).
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	// Fall back to RemoteAddr.
	host := r.RemoteAddr
	if i := strings.LastIndex(host, ":"); i != -1 {
		return host[:i]
	}
	return host
}
