package bookmarks

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"hackshelf/backend/internal/http/middleware"
)

// Bookmark is a user's saved position in a book.
type Bookmark struct {
	ID        string    `json:"id"`
	BookID    string    `json:"book_id"`
	BookTitle string    `json:"book_title,omitempty"`
	BookSlug  string    `json:"book_slug,omitempty"`
	Location  string    `json:"location"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateRequest is the payload for creating a bookmark.
type CreateRequest struct {
	Location string `json:"location"`
	Note     string `json:"note"`
}

// Validate checks the create payload.
func (req *CreateRequest) Validate() *middleware.AppError {
	if len(req.Location) == 0 || len(req.Location) > 500 {
		return middleware.NewAppError(422, "VALIDATION_ERROR", "location is required and must be at most 500 characters")
	}
	if len(req.Note) > 2000 {
		return middleware.NewAppError(422, "VALIDATION_ERROR", "note must be at most 2000 characters")
	}
	return nil
}

// Repository handles bookmarks persistence.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a new bookmarks Repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Create inserts a bookmark and returns it.
func (r *Repository) Create(ctx context.Context, userID, bookID string, req *CreateRequest) (*Bookmark, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO bookmarks (user_id, book_id, location, note)
		VALUES ($1, $2, $3, NULLIF($4, ''))
		RETURNING id, location, COALESCE(note, ''), created_at`,
		userID, bookID, req.Location, req.Note)

	b := &Bookmark{BookID: bookID}
	if err := row.Scan(&b.ID, &b.Location, &b.Note, &b.CreatedAt); err != nil {
		return nil, fmt.Errorf("failed to create bookmark: %w", err)
	}
	return b, nil
}

// scanColumns is the shared column list for bookmark queries.
const scanColumns = `bm.id, bm.book_id, bm.location, COALESCE(bm.note, ''), bm.created_at, b.title, b.slug`

// ListByUser returns all of a user's bookmarks, newest first.
func (r *Repository) ListByUser(ctx context.Context, userID string) ([]Bookmark, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+scanColumns+`
		FROM bookmarks bm
		JOIN books b ON b.id = bm.book_id
		WHERE bm.user_id = $1
		ORDER BY bm.created_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list bookmarks: %w", err)
	}
	return scanBookmarks(rows)
}

// ListByBook returns a user's bookmarks for one book, newest first.
func (r *Repository) ListByBook(ctx context.Context, userID, bookID string) ([]Bookmark, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+scanColumns+`
		FROM bookmarks bm
		JOIN books b ON b.id = bm.book_id
		WHERE bm.user_id = $1 AND bm.book_id = $2
		ORDER BY bm.created_at DESC`, userID, bookID)
	if err != nil {
		return nil, fmt.Errorf("failed to list bookmarks: %w", err)
	}
	return scanBookmarks(rows)
}

// Delete removes a bookmark only if it belongs to the user. Returns
// pgx.ErrNoRows when the bookmark does not exist for this user.
func (r *Repository) Delete(ctx context.Context, userID, bookmarkID string) error {
	ct, err := r.pool.Exec(ctx,
		`DELETE FROM bookmarks WHERE id = $1 AND user_id = $2`, bookmarkID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete bookmark: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func scanBookmarks(rows pgx.Rows) ([]Bookmark, error) {
	defer rows.Close()
	var out []Bookmark
	for rows.Next() {
		var b Bookmark
		if err := rows.Scan(&b.ID, &b.BookID, &b.Location, &b.Note, &b.CreatedAt,
			&b.BookTitle, &b.BookSlug); err != nil {
			return nil, fmt.Errorf("failed to scan bookmark: %w", err)
		}
		out = append(out, b)
	}
	return out, rows.Err()
}
