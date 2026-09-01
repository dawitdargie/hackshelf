package topics

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"

	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/http/middleware"
)

// TopicDetail is a topic with its book summaries (API spec §15).
type TopicDetail struct {
	ID    string              `json:"id"`
	Name  string              `json:"name"`
	Slug  string              `json:"slug"`
	Books []books.BookSummary `json:"books"`
}

// TopicService handles business logic for topics.
type TopicService struct {
	repo        *TopicRepository
	bookService *books.BookService
}

// NewTopicService creates a new TopicService.
func NewTopicService(repo *TopicRepository, bookService *books.BookService) *TopicService {
	return &TopicService{repo: repo, bookService: bookService}
}

// List returns all topics.
func (s *TopicService) List(ctx context.Context) ([]Topic, *middleware.AppError) {
	topics, err := s.repo.List(ctx)
	if err != nil {
		return nil, internalError()
	}
	if topics == nil {
		topics = []Topic{}
	}
	return topics, nil
}

// GetBySlug returns a topic with its books, or 404 when unknown.
func (s *TopicService) GetBySlug(ctx context.Context, slug string) (*TopicDetail, *middleware.AppError) {
	topic, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, middleware.NewAppError(http.StatusNotFound, "TOPIC_NOT_FOUND", "Topic not found")
		}
		return nil, internalError()
	}

	bookSummaries, appErr := s.bookService.ListSummariesByTopic(ctx, slug)
	if appErr != nil {
		return nil, appErr
	}
	return &TopicDetail{ID: topic.ID, Name: topic.Name, Slug: topic.Slug, Books: bookSummaries}, nil
}

// TopicHandler handles HTTP requests for topics.
type TopicHandler struct {
	service *TopicService
}

// NewTopicHandler creates a new TopicHandler.
func NewTopicHandler(service *TopicService) *TopicHandler {
	return &TopicHandler{service: service}
}

// List handles GET /api/v1/topics
func (h *TopicHandler) List(w http.ResponseWriter, r *http.Request) {
	topics, appErr := h.service.List(r.Context())
	if appErr != nil {
		books.WriteAppError(w, appErr)
		return
	}
	books.WriteJSON(w, http.StatusOK, books.DataResponse{Data: topics})
}

// GetBySlug handles GET /api/v1/topics/{slug}
func (h *TopicHandler) GetBySlug(w http.ResponseWriter, r *http.Request) {
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
