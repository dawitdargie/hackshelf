package levels

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"

	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/http/middleware"
)

// LevelDetail is a level with its book summaries (API spec §13).
type LevelDetail struct {
	ID    int                 `json:"id"`
	Name  string              `json:"name"`
	Slug  string              `json:"slug"`
	Books []books.BookSummary `json:"books"`
}

// LevelService handles business logic for levels.
type LevelService struct {
	repo        *LevelRepository
	bookService *books.BookService
}

// NewLevelService creates a new LevelService.
func NewLevelService(repo *LevelRepository, bookService *books.BookService) *LevelService {
	return &LevelService{repo: repo, bookService: bookService}
}

// List returns all levels.
func (s *LevelService) List(ctx context.Context) ([]Level, *middleware.AppError) {
	levels, err := s.repo.List(ctx)
	if err != nil {
		return nil, internalError()
	}
	if levels == nil {
		levels = []Level{}
	}
	return levels, nil
}

// GetBySlug returns a level with its books, or 404 when unknown.
func (s *LevelService) GetBySlug(ctx context.Context, slug string) (*LevelDetail, *middleware.AppError) {
	level, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, middleware.NewAppError(http.StatusNotFound, "LEVEL_NOT_FOUND", "Level not found")
		}
		return nil, internalError()
	}

	bookSummaries, appErr := s.bookService.ListSummariesByLevel(ctx, slug)
	if appErr != nil {
		return nil, appErr
	}
	return &LevelDetail{ID: level.ID, Name: level.Name, Slug: level.Slug, Books: bookSummaries}, nil
}

// LevelHandler handles HTTP requests for levels.
type LevelHandler struct {
	service *LevelService
}

// NewLevelHandler creates a new LevelHandler.
func NewLevelHandler(service *LevelService) *LevelHandler {
	return &LevelHandler{service: service}
}

// List handles GET /api/v1/levels
func (h *LevelHandler) List(w http.ResponseWriter, r *http.Request) {
	levels, appErr := h.service.List(r.Context())
	if appErr != nil {
		books.WriteAppError(w, appErr)
		return
	}
	books.WriteJSON(w, http.StatusOK, books.DataResponse{Data: levels})
}

// GetBySlug handles GET /api/v1/levels/{slug}
func (h *LevelHandler) GetBySlug(w http.ResponseWriter, r *http.Request) {
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
