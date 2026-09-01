package books

import (
	"encoding/json"
	"net/http"

	"hackshelf/backend/internal/http/middleware"
)

// BookHandler handles HTTP requests for books and chapters.
type BookHandler struct {
	service *BookService
}

// NewBookHandler creates a new BookHandler.
func NewBookHandler(service *BookService) *BookHandler {
	return &BookHandler{service: service}
}

// WriteJSON writes a successful JSON response.
func WriteJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

// WriteAppError writes a structured error from a service AppError.
func WriteAppError(w http.ResponseWriter, appErr *middleware.AppError) {
	middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
}

// DataResponse wraps the response data in a "data" field per API spec.
type DataResponse struct {
	Data interface{} `json:"data"`
}

// dataResponse wraps the response data in a "data" field per API spec.
type dataResponse = DataResponse

// listResponse is the paginated list envelope (API spec §10).
type listResponse struct {
	Data []BookSummary  `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

// writeJSON writes a successful JSON response.
func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	WriteJSON(w, status, payload)
}

// writeAppError writes a structured error from a service AppError.
func writeAppError(w http.ResponseWriter, appErr *middleware.AppError) {
	WriteAppError(w, appErr)
}

// List handles GET /api/v1/books
func (h *BookHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	params := QueryParams{
		Search:   q.Get("search"),
		Level:    q.Get("level"),
		Category: q.Get("category"),
		Topic:    q.Get("topic"),
		Rating:   q.Get("rating"),
		Sort:     q.Get("sort"),
		Page:     q.Get("page"),
		Limit:    q.Get("limit"),
	}
	summaries, meta, appErr := h.service.List(r.Context(), params)
	if appErr != nil {
		writeAppError(w, appErr)
		return
	}
	if summaries == nil {
		summaries = []BookSummary{}
	}
	writeJSON(w, http.StatusOK, listResponse{Data: summaries, Meta: meta})
}

// GetBySlug handles GET /api/v1/books/{slug}
func (h *BookHandler) GetBySlug(w http.ResponseWriter, r *http.Request) {
	book, appErr := h.service.GetBySlug(r.Context(), r.PathValue("slug"))
	if appErr != nil {
		writeAppError(w, appErr)
		return
	}
	writeJSON(w, http.StatusOK, dataResponse{Data: book})
}

// ListChapters handles GET /api/v1/books/{slug}/chapters
func (h *BookHandler) ListChapters(w http.ResponseWriter, r *http.Request) {
	chapters, appErr := h.service.ListChapters(r.Context(), r.PathValue("slug"))
	if appErr != nil {
		writeAppError(w, appErr)
		return
	}
	writeJSON(w, http.StatusOK, dataResponse{Data: chapters})
}

// GetChapter handles GET /api/v1/books/{slug}/chapters/{chapterSlug}
func (h *BookHandler) GetChapter(w http.ResponseWriter, r *http.Request) {
	chapter, appErr := h.service.GetChapter(r.Context(), r.PathValue("slug"), r.PathValue("chapterSlug"))
	if appErr != nil {
		writeAppError(w, appErr)
		return
	}
	writeJSON(w, http.StatusOK, dataResponse{Data: chapter})
}
