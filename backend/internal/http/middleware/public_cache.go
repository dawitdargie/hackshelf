package middleware

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
)

// bufferedResponse captures a handler's status, headers and body so an ETag
// can be derived from the exact bytes the client would receive.
type bufferedResponse struct {
	header http.Header
	body   bytes.Buffer
	status int
}

func (b *bufferedResponse) Header() http.Header { return b.header }

func (b *bufferedResponse) WriteHeader(status int) {
	if b.status == 0 {
		b.status = status
	}
}

func (b *bufferedResponse) Write(p []byte) (int, error) {
	if b.status == 0 {
		b.status = http.StatusOK
	}
	return b.body.Write(p)
}

// isPublicReadRequest reports whether the request may be served with a shared
// validator. Anything user-scoped or token-bearing is excluded: a cached
// validator on a per-user response would let a browser reuse another session's
// body for the same URL.
func isPublicReadRequest(r *http.Request) bool {
	if r.Method != http.MethodGet {
		return false
	}
	if r.Header.Get("Authorization") != "" {
		return false
	}
	path := r.URL.Path
	if strings.HasPrefix(path, "/api/v1/me") || strings.Contains(path, "/auth/") {
		return false
	}
	return true
}

// PublicETag adds an ETag to anonymous catalog reads and answers a matching
// If-None-Match with 304 Not Modified, so repeat visitors skip the payload
// while the handler still runs. It is the innermost middleware, so the body is
// hashed before Compress encodes it.
func PublicETag(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !isPublicReadRequest(r) {
			next.ServeHTTP(w, r)
			return
		}

		buf := &bufferedResponse{header: make(http.Header)}
		next.ServeHTTP(buf, r)

		status := buf.status
		if status == 0 {
			status = http.StatusOK
		}

		// Only successful JSON bodies get a validator; errors and empty bodies
		// are forwarded as-is.
		ct := buf.header.Get("Content-Type")
		if status != http.StatusOK || !strings.HasPrefix(ct, "application/json") {
			copyHeader(w.Header(), buf.header)
			w.WriteHeader(status)
			_, _ = w.Write(buf.body.Bytes())
			return
		}

		sum := sha256.Sum256(buf.body.Bytes())
		etag := `"` + hex.EncodeToString(sum[:16]) + `"`

		if match := r.Header.Get("If-None-Match"); match != "" && etagMatches(match, etag) {
			w.Header().Set("ETag", etag)
			w.WriteHeader(http.StatusNotModified)
			return
		}

		copyHeader(w.Header(), buf.header)
		w.Header().Set("ETag", etag)
		w.WriteHeader(status)
		_, _ = w.Write(buf.body.Bytes())
	})
}

// etagMatches handles the comma-separated list form and the * wildcard.
func etagMatches(headerValue, etag string) bool {
	for _, candidate := range strings.Split(headerValue, ",") {
		candidate = strings.TrimSpace(candidate)
		if candidate == "*" || candidate == etag || strings.TrimPrefix(candidate, "W/") == etag {
			return true
		}
	}
	return false
}

func copyHeader(dst, src http.Header) {
	for key, values := range src {
		for _, value := range values {
			dst.Add(key, value)
		}
	}
}
