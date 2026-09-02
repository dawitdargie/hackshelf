package books

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"

	"hackshelf/backend/internal/http/middleware"
)

const (
	defaultPage  = 1
	maxPage      = 1<<31 - 1 // Guard against overflow when computing offsets.
	defaultLimit = 20
	maxLimit     = 100
)

// BookService handles business logic for books and chapters.
type BookService struct {
	repo        *BookRepository
	chapterRepo *ChapterRepository
}

// NewBookService creates a new BookService.
func NewBookService(repo *BookRepository, chapterRepo *ChapterRepository) *BookService {
	return &BookService{repo: repo, chapterRepo: chapterRepo}
}

// QueryParams are the raw query-string parameters for the book list endpoint.
type QueryParams struct {
	Search   string
	Level    string
	Category string
	Topic    string
	Rating   string
	Sort     string
	Page     string
	Limit    string
}

// ValidateBookID checks that bookID is a well-formed UUID and refers to an
// existing book. Returns 422 for malformed IDs and 404 for unknown books.
// Shared with the ratings/reviews packages which key routes on book IDs.
func (s *BookService) ValidateBookID(ctx context.Context, bookID string) *middleware.AppError {
	if !UUIDRegex.MatchString(bookID) {
		return middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "invalid book id")
	}
	exists, err := s.repo.ExistsByID(ctx, bookID)
	if err != nil {
		return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	if !exists {
		return middleware.NewAppError(http.StatusNotFound, "BOOK_NOT_FOUND", "Book not found")
	}
	return nil
}

// minRatingValue/maxRatingValue bound the rating filter (API spec §12).
const (
	minRatingValue = 1.0
	maxRatingValue = 5.0
)

// List validates query params and returns one filtered page with meta.
func (s *BookService) List(ctx context.Context, p QueryParams) ([]BookSummary, PaginationMeta, *middleware.AppError) {
	page, appErr := parsePositiveInt(p.Page, defaultPage, "page")
	if appErr != nil {
		return nil, PaginationMeta{}, appErr
	}
	limit, appErr := parsePositiveInt(p.Limit, defaultLimit, "limit")
	if appErr != nil {
		return nil, PaginationMeta{}, appErr
	}
	if limit > maxLimit {
		return nil, PaginationMeta{}, middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "limit must be at most 100")
	}
	if page > maxPage {
		return nil, PaginationMeta{}, middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "page is too large")
	}

	q := BookQuery{Search: p.Search, LevelSlug: p.Level, CategorySlug: p.Category, TopicSlug: p.Topic, Page: page, Limit: limit}

	// Sort: whitelist validation, default newest.
	sortOpt, appErr := validateSort(p.Sort)
	if appErr != nil {
		return nil, PaginationMeta{}, appErr
	}
	q.Sort = sortOpt

	// Rating: numeric, within [1,5].
	minRating, appErr := parseRating(p.Rating)
	if appErr != nil {
		return nil, PaginationMeta{}, appErr
	}
	q.MinRating = minRating

	// Filter slugs must be syntactically valid and exist.
	type slugCheck struct {
		name   string
		value  string
		exists func(context.Context, string) (bool, error)
	}
	for _, c := range []slugCheck{
		{"level", p.Level, s.repo.LevelSlugExists},
		{"category", p.Category, s.repo.CategorySlugExists},
		{"topic", p.Topic, s.repo.TopicSlugExists},
	} {
		v := strings.TrimSpace(c.value)
		if v == "" {
			continue
		}
		if !slugRegex.MatchString(v) {
			return nil, PaginationMeta{}, invalidSlugError()
		}
		ok, err := c.exists(ctx, v)
		if err != nil {
			return nil, PaginationMeta{}, internalError()
		}
		if !ok {
			return nil, PaginationMeta{}, middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "unknown "+c.name+": "+v)
		}
	}
	// Assign trimmed slugs.
	q.LevelSlug, q.CategorySlug, q.TopicSlug = strings.TrimSpace(p.Level), strings.TrimSpace(p.Category), strings.TrimSpace(p.Topic)

	summaries, total, err := s.repo.List(ctx, q)
	if err != nil {
		return nil, PaginationMeta{}, internalError()
	}

	return summaries, newPaginationMeta(page, limit, total), nil
}

// GetBySlug returns full book details, or a 404 AppError when unknown.
func (s *BookService) GetBySlug(ctx context.Context, slug string) (*Book, *middleware.AppError) {
	if !slugRegex.MatchString(slug) {
		return nil, invalidSlugError()
	}

	book, err := s.repo.GetWithRelations(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, bookNotFound()
		}
		return nil, internalError()
	}
	return book, nil
}

// ListChapters returns the chapter TOC for a book slug, or 404.
func (s *BookService) ListChapters(ctx context.Context, bookSlug string) ([]ChapterMeta, *middleware.AppError) {
	if !slugRegex.MatchString(bookSlug) {
		return nil, invalidSlugError()
	}

	bookID, err := s.repo.findIDBySlug(ctx, bookSlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, bookNotFound()
		}
		return nil, internalError()
	}

	chapters, err := s.chapterRepo.ListByBook(ctx, bookID)
	if err != nil {
		return nil, internalError()
	}
	if chapters == nil {
		chapters = []ChapterMeta{}
	}
	return chapters, nil
}

// GetChapter returns a single chapter's content, or 404 for unknown book/chapter.
func (s *BookService) GetChapter(ctx context.Context, bookSlug, chapterSlug string) (*Chapter, *middleware.AppError) {
	if !slugRegex.MatchString(bookSlug) || !slugRegex.MatchString(chapterSlug) {
		return nil, invalidSlugError()
	}

	bookID, err := s.repo.findIDBySlug(ctx, bookSlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, bookNotFound()
		}
		return nil, internalError()
	}

	chapter, err := s.chapterRepo.FindBySlug(ctx, bookID, chapterSlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, middleware.NewAppError(http.StatusNotFound, "CHAPTER_NOT_FOUND", "Chapter not found")
		}
		return nil, internalError()
	}
	return chapter, nil
}

// ListSummariesByLevel returns all book summaries for a level slug.
func (s *BookService) ListSummariesByLevel(ctx context.Context, slug string) ([]BookSummary, *middleware.AppError) {
	return s.summariesByTaxon(ctx, slug, s.repo.ListSummariesByLevel)
}

// ListSummariesByCategory returns all book summaries for a category slug.
func (s *BookService) ListSummariesByCategory(ctx context.Context, slug string) ([]BookSummary, *middleware.AppError) {
	return s.summariesByTaxon(ctx, slug, s.repo.ListSummariesByCategory)
}

// ListSummariesByTopic returns all book summaries for a topic slug.
func (s *BookService) ListSummariesByTopic(ctx context.Context, slug string) ([]BookSummary, *middleware.AppError) {
	return s.summariesByTaxon(ctx, slug, s.repo.ListSummariesByTopic)
}

// ListSummariesByAuthor returns all book summaries for an author slug.
func (s *BookService) ListSummariesByAuthor(ctx context.Context, slug string) ([]BookSummary, *middleware.AppError) {
	return s.summariesByTaxon(ctx, slug, s.repo.ListSummariesByAuthor)
}

func (s *BookService) summariesByTaxon(ctx context.Context, slug string, list func(context.Context, string) ([]BookSummary, error)) ([]BookSummary, *middleware.AppError) {
	if !slugRegex.MatchString(slug) {
		return nil, invalidSlugError()
	}
	summaries, err := list(ctx, slug)
	if err != nil {
		return nil, internalError()
	}
	if summaries == nil {
		summaries = []BookSummary{}
	}
	return summaries, nil
}

// PaginationMeta is the "meta" block of list responses (API spec §10).
type PaginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

func newPaginationMeta(page, limit, total int) PaginationMeta {
	return NewPaginationMeta(page, limit, total)
}

// NewPaginationMeta computes the pagination meta block. Exported for reuse
// by paginated taxonomy endpoints.
func NewPaginationMeta(page, limit, total int) PaginationMeta {
	totalPages := (total + limit - 1) / limit
	if totalPages < 1 {
		totalPages = 1
	}
	return PaginationMeta{Page: page, Limit: limit, Total: total, TotalPages: totalPages}
}

// parsePositiveInt parses a query parameter that must be a positive integer,
// falling back to the default when empty.
func parsePositiveInt(value string, def int, name string) (int, *middleware.AppError) {
	value = strings.TrimSpace(value)
	if value == "" {
		return def, nil
	}
	n, err := strconv.Atoi(value)
	if err != nil || n < 1 {
		return 0, middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", name+" must be a positive integer")
	}
	return n, nil
}

func invalidSlugError() *middleware.AppError {
	return middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Invalid slug format")
}

// validateSort validates the sort parameter against the whitelist,
// defaulting to newest when empty.
func validateSort(value string) (SortOption, *middleware.AppError) {
	sort := strings.TrimSpace(value)
	if sort == "" {
		return SortNewest, nil
	}
	switch SortOption(sort) {
	case SortNewest, SortRating, SortMostRated:
		return SortOption(sort), nil
	default:
		return "", middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "sort must be one of: newest, rating, most-rated")
	}
}

// parseRating parses the rating filter, returning nil when empty.
func parseRating(value string) (*float64, *middleware.AppError) {
	v := strings.TrimSpace(value)
	if v == "" {
		return nil, nil
	}
	r, err := strconv.ParseFloat(v, 64)
	if err != nil || r < minRatingValue || r > maxRatingValue {
		return nil, middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "rating must be a number between 1 and 5")
	}
	return &r, nil
}

func bookNotFound() *middleware.AppError {
	return middleware.NewAppError(http.StatusNotFound, "BOOK_NOT_FOUND", "Book not found")
}

func internalError() *middleware.AppError {
	return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
}
