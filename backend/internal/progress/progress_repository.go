package progress

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"hackshelf/backend/internal/http/middleware"
)

// Entry is a reading progress record.
type Entry struct {
	Location   string  `json:"location"`
	Percentage float64 `json:"percentage"`
}

// Validate checks an upsert payload.
func (e *Entry) Validate() *middleware.AppError {
	if len(e.Location) == 0 || len(e.Location) > 500 {
		return middleware.NewAppError(422, "VALIDATION_ERROR", "location is required and must be at most 500 characters")
	}
	if e.Percentage < 0 || e.Percentage > 100 {
		return middleware.NewAppError(422, "VALIDATION_ERROR", "percentage must be between 0 and 100")
	}
	return nil
}

// Repository handles reading_progress persistence.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a new progress Repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Upsert creates or updates progress in a single statement (no read-modify-write race).
func (r *Repository) Upsert(ctx context.Context, userID, bookID string, e *Entry) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO reading_progress (user_id, book_id, location, percentage, updated_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id, book_id)
		DO UPDATE SET location = EXCLUDED.location,
		              percentage = EXCLUDED.percentage,
		              updated_at = NOW()`,
		userID, bookID, e.Location, e.Percentage)
	if err != nil {
		return fmt.Errorf("failed to upsert progress: %w", err)
	}
	return nil
}

// Get returns the user's progress for a book; pgx.ErrNoRows when none exists.
func (r *Repository) Get(ctx context.Context, userID, bookID string) (*Entry, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT location, percentage
		FROM reading_progress
		WHERE user_id = $1 AND book_id = $2`, userID, bookID)
	e := &Entry{}
	if err := row.Scan(&e.Location, &e.Percentage); err != nil {
		return nil, err
	}
	return e, nil
}

// Delete removes progress. Idempotent.
func (r *Repository) Delete(ctx context.Context, userID, bookID string) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM reading_progress WHERE user_id = $1 AND book_id = $2`, userID, bookID)
	if err != nil {
		return fmt.Errorf("failed to delete progress: %w", err)
	}
	return nil
}
