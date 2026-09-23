package middleware

import (
	"compress/gzip"
	"net/http"
	"strings"
	"sync"
)

// gzipWriters recycles writers across requests so compression costs no
// per-request allocation of the internal buffers.
var gzipWriters = sync.Pool{
	New: func() any { return gzip.NewWriter(nil) },
}

// gzipResponseWriter defers the decision to compress until the handler writes
// its headers, when the status and content type are finally known.
type gzipResponseWriter struct {
	http.ResponseWriter
	gzipWriter  *gzip.Writer
	status      int
	headerSent  bool
	compressing bool
}

func (w *gzipResponseWriter) WriteHeader(status int) {
	if w.headerSent {
		return
	}
	w.headerSent = true
	w.status = status

	// Bodies with no payload must never be wrapped, and an already-encoded
	// response (or one that is not compressible) is passed through untouched.
	if status != http.StatusNoContent && status != http.StatusNotModified && isCompressible(w.Header()) {
		w.compressing = true
		w.Header().Set("Content-Encoding", "gzip")
		w.Header().Add("Vary", "Accept-Encoding")
		w.Header().Del("Content-Length")
		w.gzipWriter.Reset(w.ResponseWriter)
	}

	w.ResponseWriter.WriteHeader(status)
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	if !w.headerSent {
		w.WriteHeader(http.StatusOK)
	}
	if !w.compressing {
		return w.ResponseWriter.Write(b)
	}
	return w.gzipWriter.Write(b)
}

// isCompressible reports whether the response is worth and safe to compress.
func isCompressible(h http.Header) bool {
	if h.Get("Content-Encoding") != "" {
		return false
	}
	ct := h.Get("Content-Type")
	return strings.HasPrefix(ct, "application/json") ||
		strings.HasPrefix(ct, "text/") ||
		strings.HasPrefix(ct, "application/javascript") ||
		strings.HasPrefix(ct, "application/xml")
}

// Compress gzips compressible responses when the client advertises gzip.
// Only used when the handler is able to send the whole body through - the API
// has no streaming endpoints, so nothing needs flush/hijack pass-through.
func Compress(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		gz := gzipWriters.Get().(*gzip.Writer)
		gw := &gzipResponseWriter{ResponseWriter: w, gzipWriter: gz}

		next.ServeHTTP(gw, r)

		if gw.compressing {
			_ = gz.Close()
		}
		gzipWriters.Put(gz)
	})
}
