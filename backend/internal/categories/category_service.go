package categories

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"

	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/http/middleware"
)

// CategoryDetail is a category with its book summaries (API spec §14).
type CategoryDetail struct {
	ID    string              `json:"id"`
	Name  string              `json:"name"`
	Slug  string              `json:"slug"`
	Books []books.BookSummary `json:"books"`
}

// CategoryService handles business logic for categories.
type CategoryService struct {
	repo        *CategoryRepository
	bookService *books.BookService
}

// NewCategoryService creates a new CategoryService.
func NewCategoryService(repo *CategoryRepository, bookService *books.BookService) *CategoryService {
	return &CategoryService{repo: repo, bookService: bookService}
}

// List returns all categories.
func (s *CategoryService) List(ctx context.Context) ([]Category, *middleware.AppError) {
	categories, err := s.repo.List(ctx)
	if err != nil {
		return nil, internalError()
	}
	if categories == nil {
		categories = []Category{}
	}
	return categories, nil
}

// GetBySlug returns a category with its books, or 404 when unknown.
func (s *CategoryService) GetBySlug(ctx context.Context, slug string) (*CategoryDetail, *middleware.AppError) {
	category, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, middleware.NewAppError(http.StatusNotFound, "CATEGORY_NOT_FOUND", "Category not found")
		}
		return nil, internalError()
	}

	bookSummaries, appErr := s.bookService.ListSummariesByCategory(ctx, slug)
	if appErr != nil {
		return nil, appErr
	}
	return &CategoryDetail{ID: category.ID, Name: category.Name, Slug: category.Slug, Books: bookSummaries}, nil
}

// CategoryHandler handles HTTP requests for categories.
type CategoryHandler struct {
	service *CategoryService
}

// NewCategoryHandler creates a new CategoryHandler.
func NewCategoryHandler(service *CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

// List handles GET /api/v1/categories
func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	categories, appErr := h.service.List(r.Context())
	if appErr != nil {
		books.WriteAppError(w, appErr)
		return
	}
	books.WriteJSON(w, http.StatusOK, books.DataResponse{Data: categories})
}

// GetBySlug handles GET /api/v1/categories/{slug}
func (h *CategoryHandler) GetBySlug(w http.ResponseWriter, r *http.Request) {
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
