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

// List validates pagination and returns one page of book summaries with meta.
func (s *BookService) List(ctx context.Context, pageStr, limitStr string) ([]BookSummary, PaginationMeta, *middleware.AppError) {
	page, appErr := parsePositiveInt(pageStr, defaultPage, "page")
	if appErr != nil {
		return nil, PaginationMeta{}, appErr
	}
	limit, appErr := parsePositiveInt(limitStr, defaultLimit, "limit")
	if appErr != nil {
		return nil, PaginationMeta{}, appErr
	}
	if limit > maxLimit {
		return nil, PaginationMeta{}, middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "limit must be at most 100")
	}
	if page > maxPage {
		return nil, PaginationMeta{}, middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "page is too large")
	}

	summaries, total, err := s.repo.List(ctx, page, limit)
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

// PaginationMeta is the "meta" block of list responses (API spec §10).
type PaginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

func newPaginationMeta(page, limit, total int) PaginationMeta {
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

func bookNotFound() *middleware.AppError {
	return middleware.NewAppError(http.StatusNotFound, "BOOK_NOT_FOUND", "Book not found")
}

func internalError() *middleware.AppError {
	return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
}
