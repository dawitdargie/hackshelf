package categories

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Category is a high-level grouping of books (API spec §14).
type Category struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// CategoryRepository handles database operations for categories.
type CategoryRepository struct {
	pool *pgxpool.Pool
}

// NewCategoryRepository creates a new CategoryRepository.
func NewCategoryRepository(pool *pgxpool.Pool) *CategoryRepository {
	return &CategoryRepository{pool: pool}
}

// List returns all categories alphabetically.
func (r *CategoryRepository) List(ctx context.Context) ([]Category, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, slug FROM categories ORDER BY name`)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug); err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		categories = append(categories, c)
	}
	return categories, rows.Err()
}

// FindBySlug returns one category, or pgx.ErrNoRows when not found.
func (r *CategoryRepository) FindBySlug(ctx context.Context, slug string) (*Category, error) {
	var c Category
	err := r.pool.QueryRow(ctx, `SELECT id, name, slug FROM categories WHERE slug = $1`, slug).
		Scan(&c.ID, &c.Name, &c.Slug)
	if err != nil {
		return nil, err
	}
	return &c, nil
}
