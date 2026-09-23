package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestRateLimitAllowsNormalLoginCadence(t *testing.T) {
	handler := RateLimit(20, 60, time.Minute, false)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// A user failing login a handful of times then succeeding in one minute
	// must never hit the limit.
	for i := 0; i < 15; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(`{}`))
		req.RemoteAddr = "203.0.113.10:1234"
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("request %d: got status %d, want 200", i+1, rec.Code)
		}
	}
}

func TestRateLimitReturns429WithRetryAfter(t *testing.T) {
	handler := RateLimit(3, 60, time.Minute, false)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	var lastCode int
	for i := 0; i < 4; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(`{}`))
		req.RemoteAddr = "203.0.113.11:1234"
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		lastCode = rec.Code
	}
	if lastCode != http.StatusTooManyRequests {
		t.Fatalf("got status %d, want 429", lastCode)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(`{}`))
	req.RemoteAddr = "203.0.113.11:1234"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if ra := rec.Header().Get("Retry-After"); ra == "" {
		t.Fatal("expected Retry-After header on 429 response")
	}
	if body := rec.Body.String(); !strings.Contains(body, "RATE_LIMITED") {
		t.Fatalf("expected RATE_LIMITED error code in body, got %q", body)
	}
}

func TestClientIPTrustsProxyOnlyWhenConfigured(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.1:5555"
	req.Header.Set("X-Forwarded-For", "198.51.100.7, 10.0.0.2")

	if got := clientIP(req, false); got != "10.0.0.1" {
		t.Fatalf("without trust: got %q, want RemoteAddr %q", got, "10.0.0.1")
	}
	if got := clientIP(req, true); got != "198.51.100.7" {
		t.Fatalf("with trust: got %q, want %q", got, "198.51.100.7")
	}
}
