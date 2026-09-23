// Package admin implements the admin-only catalog management API:
// reading books in editable form, creating taxonomy entries, and (in the
// write half, Milestone 3) creating/updating/deleting books and chapters.
//
// Every route is mounted behind AuthMiddleware + auth.RequireAdmin, so the
// handlers here can assume an authenticated admin user.
package admin

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"hackshelf/backend/internal/http/middleware"
)

// maxBodyBytes caps request bodies (chapters are large markdown blobs).
const maxBodyBytes = 8 << 20 // 8 MB

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
var uuidPattern = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

// Handler serves the admin API.
type Handler struct {
	pool *pgxpool.Pool
}

// NewHandler creates a new admin Handler.
func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

func decodeBody(w http.ResponseWriter, r *http.Request, dst interface{}) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		middleware.WriteError(w, 422, "VALIDATION_ERROR", "invalid JSON body")
		return err
	}
	return nil
}

func writeData(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"data": data})
}

// slugify derives a URL slug from arbitrary text (used when the caller omits
// the slug): lowercase, ASCII alphanumerics, single hyphen separators.
func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	lastDash := true
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z' || r >= '0' && r <= '9':
			b.WriteRune(r)
			lastDash = false
		case r >= 'A' && r <= 'Z':
			b.WriteRune(r + ('a' - 'A'))
			lastDash = false
		case !lastDash:
			b.WriteRune('-')
			lastDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

// isUniqueViolation reports a PostgreSQL unique-constraint violation (23505).
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
