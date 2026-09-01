package books

import (
	"context"
	"fmt"
)

// listSummariesByTaxon runs one summary query filtered by a taxonomy slug,
// ordered by publication/created date. Single round trip per call.
func (r *BookRepository) listSummariesByTaxon(ctx context.Context, existsClause, slug string) ([]BookSummary, error) {
	query := fmt.Sprintf(`
		SELECT b.id, b.title, b.slug, COALESCE(b.cover_url, ''),
		       l.id, l.name, l.slug,
		       rat.avg_rating, rat.rating_count
		FROM books b
		JOIN levels l ON l.id = b.level_id
		%s
		WHERE %s
		ORDER BY %s`, ratingSummarySelect, existsClause, newestClause)

	rows, err := r.pool.Query(ctx, query, slug)
	if err != nil {
		return nil, fmt.Errorf("failed to list book summaries: %w", err)
	}
	defer rows.Close()

	var summaries []BookSummary
	for rows.Next() {
		var s BookSummary
		if err := rows.Scan(
			&s.ID, &s.Title, &s.Slug, &s.CoverURL,
			&s.Level.ID, &s.Level.Name, &s.Level.Slug,
			&s.Rating.Average, &s.Rating.Count,
		); err != nil {
			return nil, fmt.Errorf("failed to scan book summary: %w", err)
		}
		summaries = append(summaries, s)
	}
	return summaries, rows.Err()
}

// ListSummariesByLevel returns all book summaries for a level slug.
func (r *BookRepository) ListSummariesByLevel(ctx context.Context, slug string) ([]BookSummary, error) {
	return r.listSummariesByTaxon(ctx, "l.slug = $1", slug)
}

// ListSummariesByCategory returns all book summaries for a category slug.
func (r *BookRepository) ListSummariesByCategory(ctx context.Context, slug string) ([]BookSummary, error) {
	return r.listSummariesByTaxon(ctx,
		"EXISTS (SELECT 1 FROM book_categories bc JOIN categories c ON c.id = bc.category_id WHERE bc.book_id = b.id AND c.slug = $1)", slug)
}

// ListSummariesByTopic returns all book summaries for a topic slug.
func (r *BookRepository) ListSummariesByTopic(ctx context.Context, slug string) ([]BookSummary, error) {
	return r.listSummariesByTaxon(ctx,
		"EXISTS (SELECT 1 FROM book_topics bt JOIN topics t ON t.id = bt.topic_id WHERE bt.book_id = b.id AND t.slug = $1)", slug)
}

// ListSummariesByAuthor returns all book summaries for an author slug.
func (r *BookRepository) ListSummariesByAuthor(ctx context.Context, slug string) ([]BookSummary, error) {
	return r.listSummariesByTaxon(ctx,
		"EXISTS (SELECT 1 FROM book_authors ba JOIN authors a ON a.id = ba.author_id WHERE ba.book_id = b.id AND a.slug = $1)", slug)
}
