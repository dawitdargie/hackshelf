package middleware

import (
	"net/http"
	"strconv"
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
	trustProxy bool          // Trust X-Forwarded-For (only behind a known proxy)
}

// NewRateLimiter creates a new rate limiter.
func NewRateLimiter(authLimit, genLimit int, window time.Duration, trustProxy bool) *rateLimiter {
	return &rateLimiter{
		requests:   make(map[string][]time.Time),
		authLimit:  authLimit,
		authWindow: window,
		genLimit:   genLimit,
		genWindow:  window,
		trustProxy: trustProxy,
	}
}

// allow checks if a request from the given IP is allowed. When the request is
// rejected it returns the duration until the caller may retry.
func (rl *rateLimiter) allow(ip string, isAuth bool) (bool, time.Duration) {
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
		// Retry-After: time until the oldest recorded request leaves the window.
		retryAfter := window - now.Sub(valid[0])
		if retryAfter < time.Second {
			retryAfter = time.Second
		}
		return false, retryAfter
	}

	rl.requests[ip] = append(valid, now)
	return true, 0
}

// prune removes IPs whose most recent request is outside the window.
func (rl *rateLimiter) prune() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	window := rl.authWindow
	if rl.genWindow > window {
		window = rl.genWindow
	}
	now := time.Now()
	for ip, timestamps := range rl.requests {
		if len(timestamps) == 0 || now.Sub(timestamps[len(timestamps)-1]) > window {
			delete(rl.requests, ip)
		}
	}
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
func RateLimit(authLimit, genLimit int, window time.Duration, trustProxy bool) func(http.Handler) http.Handler {
	rl := NewRateLimiter(authLimit, genLimit, window, trustProxy)

	// Periodically drop IPs with no requests inside the window so the map
	// cannot grow without bound on internet-facing deployments.
	go func() {
		ticker := time.NewTicker(window)
		defer ticker.Stop()
		for range ticker.C {
			rl.prune()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r, trustProxy)
			allowed, retryAfter := rl.allow(ip, isAuthPath(r.URL.Path))
			if !allowed {
				w.Header().Set("Retry-After", strconv.Itoa(int(retryAfter/time.Second)+1))
				WriteError(w, http.StatusTooManyRequests, "RATE_LIMITED",
					"Too many attempts. Please wait a minute and try again.")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// clientIP extracts the client IP from the request. X-Forwarded-For is only
// honoured when the backend is explicitly deployed behind a trusted proxy
// (TRUST_PROXY=1); otherwise it would be trivially spoofable or, in a docker
// network, collapse all traffic into a single limiter bucket.
func clientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			return strings.TrimSpace(parts[0])
		}
	}
	// Fall back to RemoteAddr.
	host := r.RemoteAddr
	if i := strings.LastIndex(host, ":"); i != -1 {
		return host[:i]
	}
	return host
}
