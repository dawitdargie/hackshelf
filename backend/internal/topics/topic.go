package topics

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Topic is a specific subject tag of books (API spec §15).
type Topic struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// TopicRepository handles database operations for topics.
type TopicRepository struct {
	pool *pgxpool.Pool
}

// NewTopicRepository creates a new TopicRepository.
func NewTopicRepository(pool *pgxpool.Pool) *TopicRepository {
	return &TopicRepository{pool: pool}
}

// List returns all topics alphabetically.
func (r *TopicRepository) List(ctx context.Context) ([]Topic, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, slug FROM topics ORDER BY name`)
	if err != nil {
		return nil, fmt.Errorf("failed to list topics: %w", err)
	}
	defer rows.Close()

	var topics []Topic
	for rows.Next() {
		var t Topic
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug); err != nil {
			return nil, fmt.Errorf("failed to scan topic: %w", err)
		}
		topics = append(topics, t)
	}
	return topics, rows.Err()
}

// FindBySlug returns one topic, or pgx.ErrNoRows when not found.
func (r *TopicRepository) FindBySlug(ctx context.Context, slug string) (*Topic, error) {
	var t Topic
	err := r.pool.QueryRow(ctx, `SELECT id, name, slug FROM topics WHERE slug = $1`, slug).
		Scan(&t.ID, &t.Name, &t.Slug)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
