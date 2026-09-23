package categories

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Category is a high-level grouping of books (API spec §14).
// book_count is filled by the list query (omitted when unknown, e.g. when a
// category is embedded in a book summary).
type Category struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	BookCount   int    `json:"book_count,omitempty"`
}

// CategoryRepository handles database operations for categories.
type CategoryRepository struct {
	pool *pgxpool.Pool
}

// NewCategoryRepository creates a new CategoryRepository.
func NewCategoryRepository(pool *pgxpool.Pool) *CategoryRepository {
	return &CategoryRepository{pool: pool}
}

// List returns all categories alphabetically with book counts in the same
// round trip (one COUNT instead of a list query per category).
func (r *CategoryRepository) List(ctx context.Context) ([]Category, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT c.id, c.name, c.slug, COALESCE(c.description, '') AS description,
		       COUNT(bc.book_id)::int AS book_count
		FROM categories c
		LEFT JOIN book_categories bc ON bc.category_id = c.id
		GROUP BY c.id, c.name, c.slug, c.description
		ORDER BY c.name`)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.BookCount); err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		categories = append(categories, c)
	}
	return categories, rows.Err()
}

// FindBySlug returns one category, or pgx.ErrNoRows when not found.
func (r *CategoryRepository) FindBySlug(ctx context.Context, slug string) (*Category, error) {
	var c Category
	err := r.pool.QueryRow(ctx, `
		SELECT c.id, c.name, c.slug, COALESCE(c.description, '') AS description,
		       COUNT(bc.book_id)::int AS book_count
		FROM categories c
		LEFT JOIN book_categories bc ON bc.category_id = c.id
		WHERE c.slug = $1
		GROUP BY c.id, c.name, c.slug, c.description`, slug).
		Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.BookCount)
	if err != nil {
		return nil, err
	}
	return &c, nil
}
