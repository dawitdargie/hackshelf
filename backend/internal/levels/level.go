package levels

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Level is a difficulty tier of the catalog (API spec §13).
type Level struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// LevelRepository handles database operations for levels.
type LevelRepository struct {
	pool *pgxpool.Pool
}

// NewLevelRepository creates a new LevelRepository.
func NewLevelRepository(pool *pgxpool.Pool) *LevelRepository {
	return &LevelRepository{pool: pool}
}

// List returns all levels ordered by their display order.
func (r *LevelRepository) List(ctx context.Context) ([]Level, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, slug FROM levels ORDER BY sort_order, name`)
	if err != nil {
		return nil, fmt.Errorf("failed to list levels: %w", err)
	}
	defer rows.Close()

	var levels []Level
	for rows.Next() {
		var l Level
		if err := rows.Scan(&l.ID, &l.Name, &l.Slug); err != nil {
			return nil, fmt.Errorf("failed to scan level: %w", err)
		}
		levels = append(levels, l)
	}
	return levels, rows.Err()
}

// FindBySlug returns one level, or pgx.ErrNoRows when not found.
func (r *LevelRepository) FindBySlug(ctx context.Context, slug string) (*Level, error) {
	var l Level
	err := r.pool.QueryRow(ctx, `SELECT id, name, slug FROM levels WHERE slug = $1`, slug).
		Scan(&l.ID, &l.Name, &l.Slug)
	if err != nil {
		return nil, err
	}
	return &l, nil
}
