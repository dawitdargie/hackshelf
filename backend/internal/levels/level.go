package levels

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Level is a difficulty tier of the catalog (API spec §13).
// book_count is filled by the list query (omitted when unknown, e.g. when a
// level is embedded in a book summary).
type Level struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	BookCount int    `json:"book_count,omitempty"`
}

// LevelRepository handles database operations for levels.
type LevelRepository struct {
	pool *pgxpool.Pool
}

// NewLevelRepository creates a new LevelRepository.
func NewLevelRepository(pool *pgxpool.Pool) *LevelRepository {
	return &LevelRepository{pool: pool}
}

// List returns all levels ordered by their display order, with book counts in
// the same round trip so callers do not need one list query per level.
func (r *LevelRepository) List(ctx context.Context) ([]Level, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT l.id, l.name, l.slug, COUNT(b.id)::int AS book_count
		FROM levels l
		LEFT JOIN books b ON b.level_id = l.id
		GROUP BY l.id, l.name, l.slug, l.sort_order
		ORDER BY l.sort_order, l.name`)
	if err != nil {
		return nil, fmt.Errorf("failed to list levels: %w", err)
	}
	defer rows.Close()

	var levels []Level
	for rows.Next() {
		var l Level
		if err := rows.Scan(&l.ID, &l.Name, &l.Slug, &l.BookCount); err != nil {
			return nil, fmt.Errorf("failed to scan level: %w", err)
		}
		levels = append(levels, l)
	}
	return levels, rows.Err()
}

// FindBySlug returns one level, or pgx.ErrNoRows when not found.
func (r *LevelRepository) FindBySlug(ctx context.Context, slug string) (*Level, error) {
	var l Level
	err := r.pool.QueryRow(ctx, `
		SELECT l.id, l.name, l.slug, COUNT(b.id)::int AS book_count
		FROM levels l
		LEFT JOIN books b ON b.level_id = l.id
		WHERE l.slug = $1
		GROUP BY l.id, l.name, l.slug`, slug).
		Scan(&l.ID, &l.Name, &l.Slug, &l.BookCount)
	if err != nil {
		return nil, err
	}
	return &l, nil
}
