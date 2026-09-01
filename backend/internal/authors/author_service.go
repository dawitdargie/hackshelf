package authors

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"

	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/http/middleware"
)

const (
	defaultPage  = 1
	defaultLimit = 20
	maxLimit     = 100
)

// AuthorDetail is an author with their book summaries (API spec §16).
type AuthorDetail struct {
	ID        string              `json:"id"`
	Name      string              `json:"name"`
	Slug      string              `json:"slug"`
	BookCount int                 `json:"book_count"`
	Books     []books.BookSummary `json:"books"`
}

// AuthorListParams are the raw pagination parameters for the author list.
type AuthorListParams struct {
	Page  string
	Limit string
}

// AuthorService handles business logic for authors.
type AuthorService struct {
	repo        *AuthorRepository
	bookService *books.BookService
}

// NewAuthorService creates a new AuthorService.
func NewAuthorService(repo *AuthorRepository, bookService *books.BookService) *AuthorService {
	return &AuthorService{repo: repo, bookService: bookService}
}

// List returns one page of authors with pagination meta.
func (s *AuthorService) List(ctx context.Context, p AuthorListParams) ([]Author, books.PaginationMeta, *middleware.AppError) {
	page, appErr := parsePositiveInt(p.Page, defaultPage, "page")
	if appErr != nil {
		return nil, books.PaginationMeta{}, appErr
	}
	limit, appErr := parsePositiveInt(p.Limit, defaultLimit, "limit")
	if appErr != nil {
		return nil, books.PaginationMeta{}, appErr
	}
	if limit > maxLimit {
		return nil, books.PaginationMeta{}, middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "limit must be at most 100")
	}

	authors, total, err := s.repo.List(ctx, limit, (page-1)*limit)
	if err != nil {
		return nil, books.PaginationMeta{}, internalError()
	}
	if authors == nil {
		authors = []Author{}
	}
	return authors, books.NewPaginationMeta(page, limit, total), nil
}

// GetBySlug returns an author with their books, or 404 when unknown.
func (s *AuthorService) GetBySlug(ctx context.Context, slug string) (*AuthorDetail, *middleware.AppError) {
	author, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, middleware.NewAppError(http.StatusNotFound, "AUTHOR_NOT_FOUND", "Author not found")
		}
		return nil, internalError()
	}

	bookSummaries, appErr := s.bookService.ListSummariesByAuthor(ctx, slug)
	if appErr != nil {
		return nil, appErr
	}
	return &AuthorDetail{
		ID:        author.ID,
		Name:      author.Name,
		Slug:      author.Slug,
		BookCount: author.BookCount,
		Books:     bookSummaries,
	}, nil
}

// AuthorHandler handles HTTP requests for authors.
type AuthorHandler struct {
	service *AuthorService
}

// NewAuthorHandler creates a new AuthorHandler.
func NewAuthorHandler(service *AuthorService) *AuthorHandler {
	return &AuthorHandler{service: service}
}

// List handles GET /api/v1/authors
func (h *AuthorHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	authors, meta, appErr := h.service.List(r.Context(), AuthorListParams{
		Page:  q.Get("page"),
		Limit: q.Get("limit"),
	})
	if appErr != nil {
		books.WriteAppError(w, appErr)
		return
	}
	books.WriteJSON(w, http.StatusOK, struct {
		Data []Author             `json:"data"`
		Meta books.PaginationMeta `json:"meta"`
	}{Data: authors, Meta: meta})
}

// GetBySlug handles GET /api/v1/authors/{slug}
func (h *AuthorHandler) GetBySlug(w http.ResponseWriter, r *http.Request) {
	detail, appErr := h.service.GetBySlug(r.Context(), r.PathValue("slug"))
	if appErr != nil {
		books.WriteAppError(w, appErr)
		return
	}
	books.WriteJSON(w, http.StatusOK, books.DataResponse{Data: detail})
}

func internalError() *middleware.AppError {
	return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
}

// parsePositiveInt parses a pagination parameter, falling back to the
// default when empty. Mirrors the books package helper (unexported there).
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
