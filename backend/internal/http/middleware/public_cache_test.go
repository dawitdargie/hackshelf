package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func etagHandler() http.Handler {
	return PublicETag(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":[{"slug":"owasp-top-10-2021"}]}`))
	}))
}

func TestPublicETagSetsValidatorOnAnonymousCatalogRead(t *testing.T) {
	rec := httptest.NewRecorder()
	etagHandler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/books", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if rec.Header().Get("ETag") == "" {
		t.Fatal("expected an ETag on an anonymous catalog read")
	}
	if rec.Body.String() != `{"data":[{"slug":"owasp-top-10-2021"}]}` {
		t.Errorf("body = %q, want the handler's JSON", rec.Body.String())
	}
}

func TestPublicETagAnswersMatchingConditional(t *testing.T) {
	first := httptest.NewRecorder()
	etagHandler().ServeHTTP(first, httptest.NewRequest(http.MethodGet, "/api/v1/books", nil))
	etag := first.Header().Get("ETag")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/books", nil)
	req.Header.Set("If-None-Match", etag)
	second := httptest.NewRecorder()
	etagHandler().ServeHTTP(second, req)

	if second.Code != http.StatusNotModified {
		t.Fatalf("status = %d, want 304", second.Code)
	}
	if second.Body.Len() != 0 {
		t.Errorf("304 must carry no body, got %d bytes", second.Body.Len())
	}
	if second.Header().Get("ETag") != etag {
		t.Errorf("ETag = %q, want %q", second.Header().Get("ETag"), etag)
	}
}

func TestPublicETagRefreshesWhenContentChanges(t *testing.T) {
	handler := PublicETag(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(r.URL.Query().Get("v")))
	}))

	first := httptest.NewRecorder()
	handler.ServeHTTP(first, httptest.NewRequest(http.MethodGet, "/api/v1/books?v=a", nil))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/books?v=b", nil)
	req.Header.Set("If-None-Match", first.Header().Get("ETag"))
	second := httptest.NewRecorder()
	handler.ServeHTTP(second, req)

	if second.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 for changed content", second.Code)
	}
}

func TestPublicETagSkipsUserScopedAndTokenBearingRequests(t *testing.T) {
	cases := []struct {
		name string
		path string
		auth string
	}{
		{"library", "/api/v1/me/library", ""},
		{"auth route", "/api/v1/auth/refresh", ""},
		{"token bearing catalog call", "/api/v1/books", "Bearer token"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			if tc.auth != "" {
				req.Header.Set("Authorization", tc.auth)
			}
			rec := httptest.NewRecorder()
			etagHandler().ServeHTTP(rec, req)

			if rec.Header().Get("ETag") != "" {
				t.Errorf("ETag = %q, want none: user-scoped responses must not be cacheable", rec.Header().Get("ETag"))
			}
		})
	}
}

func TestPublicETagSkipsNonGetAndErrors(t *testing.T) {
	post := httptest.NewRecorder()
	etagHandler().ServeHTTP(post, httptest.NewRequest(http.MethodPost, "/api/v1/books", nil))
	if post.Header().Get("ETag") != "" {
		t.Errorf("POST must not receive an ETag")
	}

	erroring := PublicETag(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"error":{"code":"BOOK_NOT_FOUND"}}`))
	}))
	rec := httptest.NewRecorder()
	erroring.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/books/nope", nil))

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	if rec.Header().Get("ETag") != "" {
		t.Errorf("error responses must not carry an ETag")
	}
	if rec.Body.String() != `{"error":{"code":"BOOK_NOT_FOUND"}}` {
		t.Errorf("error body = %q, want the handler's JSON", rec.Body.String())
	}
}
