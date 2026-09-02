package reviews

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Review is a user review with the author's public info (API spec §17).
type Review struct {
	ID        string     `json:"id"`
	User      ReviewUser `json:"user"`
	Content   string     `json:"content"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// ReviewUser is the public user info embedded in a review.
type ReviewUser struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

// uniqueViolationCode is the Postgres error code for unique constraint violations.
const uniqueViolationCode = "23505"

// ReviewRepository handles persistence for book reviews.
type ReviewRepository struct {
	pool *pgxpool.Pool
}

// NewReviewRepository creates a new ReviewRepository.
func NewReviewRepository(pool *pgxpool.Pool) *ReviewRepository {
	return &ReviewRepository{pool: pool}
}

// Create inserts a review. Returns ErrDuplicateReview when the user already
// has a review for the book (unique constraint).
func (r *ReviewRepository) Create(ctx context.Context, userID, bookID, content string) (*Review, error) {
	row := r.pool.QueryRow(ctx, `
		WITH inserted AS (
			INSERT INTO reviews (user_id, book_id, content)
			VALUES ($1, $2, $3)
			RETURNING id, user_id, content, created_at, updated_at
		)
		SELECT i.id, i.user_id, u.username, i.content, i.created_at, i.updated_at
		FROM inserted i
		JOIN users u ON u.id = i.user_id`,
		userID, bookID, content)

	review := &Review{}
	if err := row.Scan(&review.ID, &review.User.ID, &review.User.Username,
		&review.Content, &review.CreatedAt, &review.UpdatedAt); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolationCode {
			return nil, ErrDuplicateReview
		}
		return nil, fmt.Errorf("failed to create review: %w", err)
	}
	return review, nil
}

// ErrDuplicateReview is returned when a user already reviewed the book.
var ErrDuplicateReview = errors.New("review already exists for this book")

// FindByBook lists all reviews for a book, newest first (API spec §17).
func (r *ReviewRepository) FindByBook(ctx context.Context, bookID string) ([]Review, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT rv.id, u.id, u.username, rv.content, rv.created_at, rv.updated_at
		FROM reviews rv
		JOIN users u ON u.id = rv.user_id
		WHERE rv.book_id = $1
		ORDER BY rv.created_at DESC`, bookID)
	if err != nil {
		return nil, fmt.Errorf("failed to list reviews: %w", err)
	}
	defer rows.Close()

	var reviews []Review
	for rows.Next() {
		var rv Review
		if err := rows.Scan(&rv.ID, &rv.User.ID, &rv.User.Username, &rv.Content, &rv.CreatedAt, &rv.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan review: %w", err)
		}
		reviews = append(reviews, rv)
	}
	return reviews, rows.Err()
}

// FindByID fetches a review by ID. Returns (nil, nil) when not found.
func (r *ReviewRepository) FindByID(ctx context.Context, reviewID string) (*Review, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT rv.id, u.id, u.username, rv.content, rv.created_at, rv.updated_at
		FROM reviews rv
		JOIN users u ON u.id = rv.user_id
		WHERE rv.id = $1`, reviewID)

	review := &Review{}
	if err := row.Scan(&review.ID, &review.User.ID, &review.User.Username, &review.Content, &review.CreatedAt, &review.UpdatedAt); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find review: %w", err)
	}
	return review, nil
}

// Update sets new content on a review owned by userID. Returns false when no
// matching row exists (missing or not owned by the user).
func (r *ReviewRepository) Update(ctx context.Context, reviewID, userID, content string) (bool, error) {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reviews SET content = $1, updated_at = NOW()
		WHERE id = $2 AND user_id = $3`,
		content, reviewID, userID)
	if err != nil {
		return false, fmt.Errorf("failed to update review: %w", err)
	}
	return tag.RowsAffected() > 0, nil
}

// Delete removes a review owned by userID. Returns false when no matching row exists.
func (r *ReviewRepository) Delete(ctx context.Context, reviewID, userID string) (bool, error) {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM reviews WHERE id = $1 AND user_id = $2`, reviewID, userID)
	if err != nil {
		return false, fmt.Errorf("failed to delete review: %w", err)
	}
	return tag.RowsAffected() > 0, nil
}
