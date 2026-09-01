package books

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// BookRepository handles database operations for books.
type BookRepository struct {
	pool *pgxpool.Pool
}

// NewBookRepository creates a new BookRepository.
func NewBookRepository(pool *pgxpool.Pool) *BookRepository {
	return &BookRepository{pool: pool}
}

// ratingSummarySelect is the aggregate rating subquery joined via LATERAL so
// the list query stays a single round trip (uses idx_ratings_book_id).
const ratingSummarySelect = `
	LEFT JOIN LATERAL (
		SELECT COALESCE(AVG(r.rating), 0)::float AS avg_rating,
		       COUNT(r.id)::int AS rating_count
		FROM ratings r
		WHERE r.book_id = b.id
	) rat ON true`

// SortOption is a whitelisted sort ordering. Order-by SQL lives here, never
// in user input.
type SortOption string

const (
	SortNewest    SortOption = "newest"
	SortRating    SortOption = "rating"
	SortMostRated SortOption = "most-rated"
)

// sortClauses maps sort options to ORDER BY SQL. Ties broken by created_at
// for stable pagination.
var sortClauses = map[SortOption]string{
	SortNewest:    "b.created_at DESC",
	SortRating:    "rat.avg_rating DESC, rat.rating_count DESC, b.created_at DESC",
	SortMostRated: "rat.rating_count DESC, rat.avg_rating DESC, b.created_at DESC",
}

// newestClause sorts by publication date when present, falling back to created_at.
const newestClause = "COALESCE(b.publication_date, b.created_at::date) DESC, b.created_at DESC"

// BookQuery carries the parsed filter/sort/pagination parameters for List.
type BookQuery struct {
	Search       string
	LevelSlug    string
	CategorySlug string
	TopicSlug    string
	MinRating    *float64
	Sort         SortOption
	Page         int
	Limit        int
}

// List returns one filtered/sorted page of book summaries plus the total
// matching count. All values are parameterized; only whitelisted SQL ever
// reaches the query text.
func (r *BookRepository) List(ctx context.Context, q BookQuery) ([]BookSummary, int, error) {
	offset := (q.Page - 1) * q.Limit

	// WHERE builder: collects clauses and args in order.
	where := []string{"true"}
	var args []interface{}
	arg := func(v interface{}) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if s := strings.TrimSpace(q.Search); s != "" {
		ph := arg(s)
		// Match title/description via full-text + ILIKE, and author names
		// via EXISTS (uses idx_book_authors_author_id / PK index).
		where = append(where, fmt.Sprintf(
			"(b.search_vec @@ plainto_tsquery('english', %s) OR b.title ILIKE '%%'||%s||'%%' OR b.description ILIKE '%%'||%s||'%%' OR EXISTS (SELECT 1 FROM book_authors ba JOIN authors a ON a.id = ba.author_id WHERE ba.book_id = b.id AND a.name ILIKE '%%'||%s||'%%'))",
			ph, ph, ph, ph))
	}
	if q.LevelSlug != "" {
		where = append(where, "l.slug = "+arg(q.LevelSlug))
	}
	if q.CategorySlug != "" {
		where = append(where, "EXISTS (SELECT 1 FROM book_categories bc JOIN categories c ON c.id = bc.category_id WHERE bc.book_id = b.id AND c.slug = "+arg(q.CategorySlug)+")")
	}
	if q.TopicSlug != "" {
		where = append(where, "EXISTS (SELECT 1 FROM book_topics bt JOIN topics t ON t.id = bt.topic_id WHERE bt.book_id = b.id AND t.slug = "+arg(q.TopicSlug)+")")
	}
	if q.MinRating != nil {
		where = append(where, "rat.avg_rating >= "+arg(*q.MinRating))
	}
	whereSQL := strings.Join(where, " AND ")

	orderBy, ok := sortClauses[q.Sort]
	if !ok {
		return nil, 0, fmt.Errorf("unsupported sort option: %s", q.Sort)
	}
	if q.Sort == SortNewest {
		orderBy = newestClause
	}

	// The window count is computed before LIMIT, so it reflects the full
	// filtered set while the WHERE text appears only once.
	query := fmt.Sprintf(`
		SELECT b.id, b.title, b.slug, COALESCE(b.cover_url, '') AS cover_url,
		       l.id AS level_id, l.name AS level_name, l.slug AS level_slug,
		       rat.avg_rating, rat.rating_count,
		       COUNT(*) OVER () AS total
		FROM books b
		JOIN levels l ON l.id = b.level_id
		%s
		WHERE %s
		ORDER BY %s
		LIMIT %d OFFSET %d`,
		ratingSummarySelect, whereSQL, orderBy, q.Limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list books: %w", err)
	}
	defer rows.Close()

	var summaries []BookSummary
	total := 0
	for rows.Next() {
		var s BookSummary
		if err := rows.Scan(
			&s.ID, &s.Title, &s.Slug, &s.CoverURL,
			&s.Level.ID, &s.Level.Name, &s.Level.Slug,
			&s.Rating.Average, &s.Rating.Count,
			&total, // COUNT(*) OVER () — full filtered count
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan book summary: %w", err)
		}
		summaries = append(summaries, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("failed to iterate book summaries: %w", err)
	}
	return summaries, total, nil
}

// LevelSlugExists reports whether a level slug exists.
func (r *BookRepository) LevelSlugExists(ctx context.Context, slug string) (bool, error) {
	return r.slugExists(ctx, `SELECT 1 FROM levels WHERE slug = $1`, slug)
}

// CategorySlugExists reports whether a category slug exists.
func (r *BookRepository) CategorySlugExists(ctx context.Context, slug string) (bool, error) {
	return r.slugExists(ctx, `SELECT 1 FROM categories WHERE slug = $1`, slug)
}

// TopicSlugExists reports whether a topic slug exists.
func (r *BookRepository) TopicSlugExists(ctx context.Context, slug string) (bool, error) {
	return r.slugExists(ctx, `SELECT 1 FROM topics WHERE slug = $1`, slug)
}

func (r *BookRepository) slugExists(ctx context.Context, query, slug string) (bool, error) {
	var one int
	err := r.pool.QueryRow(ctx, query, slug).Scan(&one)
	if err == pgx.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("failed to check slug: %w", err)
	}
	return true, nil
}

// FindBySlug returns the core book row (book + level + rating) for a slug.
// Returns pgx.ErrNoRows when the book does not exist.
func (r *BookRepository) FindBySlug(ctx context.Context, slug string) (*Book, error) {
	b := &Book{}
	var coverURL, license *string
	var pubDate *time.Time

	err := r.pool.QueryRow(ctx, `
		SELECT b.id, b.title, b.slug, b.description, COALESCE(b.cover_url, ''),
		       l.id, l.name, l.slug,
		       b.source_url, b.license, b.publication_date,
		       rat.avg_rating, rat.rating_count
		FROM books b
		JOIN levels l ON l.id = b.level_id
		`+ratingSummarySelect+`
		WHERE b.slug = $1`, slug,
	).Scan(
		&b.ID, &b.Title, &b.Slug, &b.Description, &coverURL,
		&b.Level.ID, &b.Level.Name, &b.Level.Slug,
		&b.SourceURL, &license, &pubDate,
		&b.Rating.Average, &b.Rating.Count,
	)
	if err != nil {
		return nil, err
	}

	if coverURL != nil {
		b.CoverURL = *coverURL
	}
	if license != nil {
		b.License = *license
	}
	if pubDate != nil {
		b.PublicationDate = pubDate.Format("2006-01-02")
	}
	return b, nil
}

// findIDBySlug resolves a book slug to its ID. Returns pgx.ErrNoRows when not found.
func (r *BookRepository) findIDBySlug(ctx context.Context, slug string) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx, `SELECT id FROM books WHERE slug = $1`, slug).Scan(&id)
	return id, err
}

// listAuthors loads all authors of a book in one query.
func (r *BookRepository) listAuthors(ctx context.Context, bookID string) ([]Author, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT a.id, a.name, a.slug
		FROM book_authors ba
		JOIN authors a ON a.id = ba.author_id
		WHERE ba.book_id = $1
		ORDER BY a.name`, bookID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var authors []Author
	for rows.Next() {
		var a Author
		if err := rows.Scan(&a.ID, &a.Name, &a.Slug); err != nil {
			return nil, err
		}
		authors = append(authors, a)
	}
	return authors, rows.Err()
}

// listCategories loads all categories of a book in one query.
func (r *BookRepository) listCategories(ctx context.Context, bookID string) ([]Category, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT c.id, c.name, c.slug
		FROM book_categories bc
		JOIN categories c ON c.id = bc.category_id
		WHERE bc.book_id = $1
		ORDER BY c.name`, bookID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, rows.Err()
}

// listTopics loads all topics of a book in one query.
func (r *BookRepository) listTopics(ctx context.Context, bookID string) ([]Topic, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT t.id, t.name, t.slug
		FROM book_topics bt
		JOIN topics t ON t.id = bt.topic_id
		WHERE bt.book_id = $1
		ORDER BY t.name`, bookID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var topics []Topic
	for rows.Next() {
		var t Topic
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug); err != nil {
			return nil, err
		}
		topics = append(topics, t)
	}
	return topics, rows.Err()
}

// GetWithRelations loads a book with its authors, categories, and topics
// using three batched queries (no N+1).
func (r *BookRepository) GetWithRelations(ctx context.Context, slug string) (*Book, error) {
	book, err := r.FindBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	if book.Authors, err = r.listAuthors(ctx, book.ID); err != nil {
		return nil, fmt.Errorf("failed to load authors: %w", err)
	}
	if book.Categories, err = r.listCategories(ctx, book.ID); err != nil {
		return nil, fmt.Errorf("failed to load categories: %w", err)
	}
	if book.Topics, err = r.listTopics(ctx, book.ID); err != nil {
		return nil, fmt.Errorf("failed to load topics: %w", err)
	}

	if book.Authors == nil {
		book.Authors = []Author{}
	}
	if book.Categories == nil {
		book.Categories = []Category{}
	}
	if book.Topics == nil {
		book.Topics = []Topic{}
	}
	return book, nil
}
