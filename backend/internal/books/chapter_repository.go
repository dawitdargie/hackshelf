package books

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ChapterRepository handles database operations for hosted chapters.
type ChapterRepository struct {
	pool *pgxpool.Pool
}

// NewChapterRepository creates a new ChapterRepository.
func NewChapterRepository(pool *pgxpool.Pool) *ChapterRepository {
	return &ChapterRepository{pool: pool}
}

// ListByBook returns the TOC (metadata only) of a book's chapters, ordered.
// Covered by idx_chapters_book_order.
func (r *ChapterRepository) ListByBook(ctx context.Context, bookID string) ([]ChapterMeta, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, chapter_order
		FROM chapters
		WHERE book_id = $1
		ORDER BY chapter_order`, bookID)
	if err != nil {
		return nil, fmt.Errorf("failed to list chapters: %w", err)
	}
	defer rows.Close()

	var chapters []ChapterMeta
	for rows.Next() {
		var c ChapterMeta
		if err := rows.Scan(&c.ID, &c.Slug, &c.Title, &c.ChapterOrder); err != nil {
			return nil, fmt.Errorf("failed to scan chapter: %w", err)
		}
		chapters = append(chapters, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate chapters: %w", err)
	}
	return chapters, nil
}

// FindBySlug returns a single chapter's full content.
// Returns pgx.ErrNoRows when the chapter does not exist.
func (r *ChapterRepository) FindBySlug(ctx context.Context, bookID, slug string) (*Chapter, error) {
	c := &Chapter{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, slug, title, chapter_order, content
		FROM chapters
		WHERE book_id = $1 AND slug = $2`, bookID, slug,
	).Scan(&c.ID, &c.Slug, &c.Title, &c.ChapterOrder, &c.Content)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, err
		}
		return nil, fmt.Errorf("failed to find chapter: %w", err)
	}
	return c, nil
}
