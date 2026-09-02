package library

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/http/middleware"
)

// uniqueViolationCode is the Postgres error code for unique constraint violations.
const uniqueViolationCode = "23505"

// ErrAlreadySaved indicates the book is already in the user's library.
var ErrAlreadySaved = errors.New("book already saved")

// LibraryRepository handles saved_books persistence.
type LibraryRepository struct {
	pool        *pgxpool.Pool
	bookService *books.BookService
}

// NewLibraryRepository creates a new LibraryRepository.
func NewLibraryRepository(pool *pgxpool.Pool, bookService *books.BookService) *LibraryRepository {
	return &LibraryRepository{pool: pool, bookService: bookService}
}

// Save inserts a saved_books row for the user. Returns ErrAlreadySaved on duplicates.
func (r *LibraryRepository) Save(ctx context.Context, userID, bookID string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO saved_books (user_id, book_id) VALUES ($1, $2)`, userID, bookID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolationCode {
			return ErrAlreadySaved
		}
		return fmt.Errorf("failed to save book: %w", err)
	}
	return nil
}

// Remove deletes the saved_books row. Idempotent.
func (r *LibraryRepository) Remove(ctx context.Context, userID, bookID string) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM saved_books WHERE user_id = $1 AND book_id = $2`, userID, bookID)
	if err != nil {
		return fmt.Errorf("failed to remove saved book: %w", err)
	}
	return nil
}

// SavedBooks lists the user's saved books as catalog summaries, newest save first.
func (r *LibraryRepository) SavedBooks(ctx context.Context, userID string) ([]books.BookSummary, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT b.id, b.title, b.slug, COALESCE(b.cover_url, ''),
		       l.id, l.name, l.slug,
		       rat.avg_rating, rat.rating_count
		FROM saved_books sb
		JOIN books b ON b.id = sb.book_id
		JOIN levels l ON l.id = b.level_id
		`+books.RatingSummarySelect+`
		WHERE sb.user_id = $1
		ORDER BY sb.created_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list saved books: %w", err)
	}
	return collectSummaries(rows)
}

// ReadingItem is a book the user is currently reading, with progress.
type ReadingItem struct {
	Book       books.BookSummary `json:"book"`
	Location   string            `json:"location"`
	Percentage float64           `json:"percentage"`
	UpdatedAt  time.Time         `json:"-"`
}

// CurrentlyReading lists in-progress books (0 < percentage < 100), newest activity first.
func (r *LibraryRepository) CurrentlyReading(ctx context.Context, userID string, limit int) ([]ReadingItem, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT b.id, b.title, b.slug, COALESCE(b.cover_url, ''),
		       l.id, l.name, l.slug,
		       rat.avg_rating, rat.rating_count,
		       rp.location, rp.percentage, rp.updated_at
		FROM reading_progress rp
		JOIN books b ON b.id = rp.book_id
		JOIN levels l ON l.id = b.level_id
		`+books.RatingSummarySelect+`
		WHERE rp.user_id = $1 AND rp.percentage > 0 AND rp.percentage < 100
		ORDER BY rp.updated_at DESC
		LIMIT $2`, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list currently reading: %w", err)
	}
	defer rows.Close()

	var items []ReadingItem
	for rows.Next() {
		var it ReadingItem
		if err := rows.Scan(
			&it.Book.ID, &it.Book.Title, &it.Book.Slug, &it.Book.CoverURL,
			&it.Book.Level.ID, &it.Book.Level.Name, &it.Book.Level.Slug,
			&it.Book.Rating.Average, &it.Book.Rating.Count,
			&it.Location, &it.Percentage, &it.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan reading item: %w", err)
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

// ProgressEntry is a compact progress record for the library summary.
type ProgressEntry struct {
	BookID     string    `json:"book_id"`
	Location   string    `json:"location"`
	Percentage float64   `json:"percentage"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// AllProgress lists every progress row for the user.
func (r *LibraryRepository) AllProgress(ctx context.Context, userID string) ([]ProgressEntry, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT book_id, location, percentage, updated_at
		FROM reading_progress
		WHERE user_id = $1
		ORDER BY updated_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list progress: %w", err)
	}
	defer rows.Close()

	var entries []ProgressEntry
	for rows.Next() {
		var e ProgressEntry
		if err := rows.Scan(&e.BookID, &e.Location, &e.Percentage, &e.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan progress entry: %w", err)
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

// collectSummaries scans a BookSummary result set (shared by the queries above).
func collectSummaries(rows pgx.Rows) ([]books.BookSummary, error) {
	defer rows.Close()
	var out []books.BookSummary
	for rows.Next() {
		var s books.BookSummary
		if err := rows.Scan(
			&s.ID, &s.Title, &s.Slug, &s.CoverURL,
			&s.Level.ID, &s.Level.Name, &s.Level.Slug,
			&s.Rating.Average, &s.Rating.Count,
		); err != nil {
			return nil, fmt.Errorf("failed to scan book summary: %w", err)
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// ensure middleware import stays meaningful for future AppError mapping.
var _ = middleware.NewAppError
