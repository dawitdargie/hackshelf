package authors

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Author is a book author with its book count (API spec §16).
type Author struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	BookCount int    `json:"book_count"`
}

// AuthorRepository handles database operations for authors.
type AuthorRepository struct {
	pool *pgxpool.Pool
}

// NewAuthorRepository creates a new AuthorRepository.
func NewAuthorRepository(pool *pgxpool.Pool) *AuthorRepository {
	return &AuthorRepository{pool: pool}
}

// List returns one page of authors alphabetically with their book counts,
// plus the total author count.
func (r *AuthorRepository) List(ctx context.Context, limit, offset int) ([]Author, int, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT a.id, a.name, a.slug, COUNT(ba.book_id)::int,
		       COUNT(*) OVER () AS total
		FROM authors a
		LEFT JOIN book_authors ba ON ba.author_id = a.id
		GROUP BY a.id, a.name, a.slug
		ORDER BY a.name
		LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list authors: %w", err)
	}
	defer rows.Close()

	var authors []Author
	total := 0
	for rows.Next() {
		var a Author
		if err := rows.Scan(&a.ID, &a.Name, &a.Slug, &a.BookCount, &total); err != nil {
			return nil, 0, fmt.Errorf("failed to scan author: %w", err)
		}
		authors = append(authors, a)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return authors, total, nil
}

// FindBySlug returns one author, or pgx.ErrNoRows when not found.
func (r *AuthorRepository) FindBySlug(ctx context.Context, slug string) (*Author, error) {
	var a Author
	err := r.pool.QueryRow(ctx, `
		SELECT a.id, a.name, a.slug, COUNT(ba.book_id)::int
		FROM authors a
		LEFT JOIN book_authors ba ON ba.author_id = a.id
		WHERE a.slug = $1
		GROUP BY a.id, a.name, a.slug`, slug).
		Scan(&a.ID, &a.Name, &a.Slug, &a.BookCount)
	if err != nil {
		return nil, err
	}
	return &a, nil
}
