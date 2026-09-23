package middleware

import (
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCompressGzipsLargeJSON(t *testing.T) {
	body := `{"data":"` + strings.Repeat("hackshelf", 400) + `"}`
	handler := Compress(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(body))
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/books", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if got := rec.Header().Get("Content-Encoding"); got != "gzip" {
		t.Fatalf("Content-Encoding = %q, want gzip", got)
	}
	if !strings.Contains(rec.Header().Get("Vary"), "Accept-Encoding") {
		t.Errorf("Vary = %q, want it to include Accept-Encoding", rec.Header().Get("Vary"))
	}

	reader, err := gzip.NewReader(rec.Body)
	if err != nil {
		t.Fatalf("body is not valid gzip: %v", err)
	}
	decoded, err := io.ReadAll(reader)
	if err != nil {
		t.Fatalf("failed to read gzip body: %v", err)
	}
	if string(decoded) != body {
		t.Errorf("round-tripped body does not match the original")
	}
	// The encoded response must actually be smaller for this payload.
	if rec.Body.Len() >= len(body) {
		t.Errorf("compressed size %d is not smaller than %d", rec.Body.Len(), len(body))
	}
}

func TestCompressSkipsClientThatCannotGzip(t *testing.T) {
	handler := Compress(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":[]}`))
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/books", nil))

	if got := rec.Header().Get("Content-Encoding"); got != "" {
		t.Fatalf("Content-Encoding = %q, want empty for a client without gzip", got)
	}
	if rec.Body.String() != `{"data":[]}` {
		t.Errorf("body = %q, want the raw JSON", rec.Body.String())
	}
}

func TestCompressLeavesNoContentAlone(t *testing.T) {
	handler := Compress(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodDelete, "/api/v1/me/library/1", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", rec.Code)
	}
	if got := rec.Header().Get("Content-Encoding"); got != "" {
		t.Errorf("Content-Encoding = %q, want empty on a 204", got)
	}
}

func TestCompressPreservesStatusAndContentType(t *testing.T) {
	handler := Compress(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(strings.Repeat("x", 2000)))
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/books/nope", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", got)
	}
}

// The two middlewares are wired together in the router (PublicETag innermost,
// Compress outside it), so verify the pair end to end: a gzip client gets a
// valid ETag on the compressed response and a 304 on the conditional retry.
func TestCompressWithPublicETagEndToEnd(t *testing.T) {
	payload := `{"data":[` + strings.Repeat(`{"title":"OWASP Top 10","slug":"owasp-top-10-2021"},`, 40) + `{}]}`
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(payload))
	})
	handler := Compress(PublicETag(inner))

	first := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/books", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	handler.ServeHTTP(first, req)

	if first.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", first.Code)
	}
	etag := first.Header().Get("ETag")
	if etag == "" {
		t.Fatal("expected an ETag alongside the compressed body")
	}
	if got := first.Header().Get("Content-Encoding"); got != "gzip" {
		t.Fatalf("Content-Encoding = %q, want gzip", got)
	}

	reader, err := gzip.NewReader(first.Body)
	if err != nil {
		t.Fatalf("body is not valid gzip: %v", err)
	}
	decoded, err := io.ReadAll(reader)
	if err != nil {
		t.Fatalf("failed to read gzip body: %v", err)
	}
	if string(decoded) != payload {
		t.Errorf("decompressed body does not match the handler payload")
	}
	if first.Body.Len() >= len(payload) {
		t.Errorf("compressed size %d is not smaller than %d", first.Body.Len(), len(payload))
	}

	// Conditional retry reuses the validator and must not re-send the body.
	second := httptest.NewRecorder()
	retry := httptest.NewRequest(http.MethodGet, "/api/v1/books", nil)
	retry.Header.Set("Accept-Encoding", "gzip")
	retry.Header.Set("If-None-Match", etag)
	handler.ServeHTTP(second, retry)

	if second.Code != http.StatusNotModified {
		t.Fatalf("status = %d, want 304", second.Code)
	}
	if second.Body.Len() != 0 {
		t.Errorf("304 carried %d bytes, want none", second.Body.Len())
	}
	if got := second.Header().Get("Content-Encoding"); got != "" {
		t.Errorf("Content-Encoding = %q, want empty on a 304", got)
	}
}
