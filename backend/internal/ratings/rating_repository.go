package ratings

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RatingRepository handles persistence for book ratings.
type RatingRepository struct {
	pool *pgxpool.Pool
}

// NewRatingRepository creates a new RatingRepository.
func NewRatingRepository(pool *pgxpool.Pool) *RatingRepository {
	return &RatingRepository{pool: pool}
}

// Upsert creates the user's rating for a book, or updates it if one exists.
// The (user_id, book_id) unique constraint makes this a single atomic round trip.
func (r *RatingRepository) Upsert(ctx context.Context, userID, bookID string, rating int) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO ratings (user_id, book_id, rating)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, book_id)
		DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()`,
		userID, bookID, rating)
	if err != nil {
		return fmt.Errorf("failed to upsert rating: %w", err)
	}
	return nil
}

// Delete removes the user's rating for a book. Returns false if no rating
// existed (delete is idempotent — callers still respond 204).
func (r *RatingRepository) Delete(ctx context.Context, userID, bookID string) (bool, error) {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM ratings WHERE user_id = $1 AND book_id = $2`, userID, bookID)
	if err != nil {
		return false, fmt.Errorf("failed to delete rating: %w", err)
	}
	return tag.RowsAffected() > 0, nil
}
