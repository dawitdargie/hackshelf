package reviews

import (
	"encoding/json"
	"errors"
	"net/http"

	"hackshelf/backend/internal/auth"
	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/http/middleware"
)

// maxBodyBytes limits request body size (guards against oversized payloads).
const maxBodyBytes = 1 << 13 // 8 KB (reviews can be up to 5000 chars)

// ReviewHandler handles HTTP requests for book reviews.
type ReviewHandler struct {
	repo        *ReviewRepository
	bookService *books.BookService
}

// NewReviewHandler creates a new ReviewHandler.
func NewReviewHandler(repo *ReviewRepository, bookService *books.BookService) *ReviewHandler {
	return &ReviewHandler{repo: repo, bookService: bookService}
}

// decodeJSON decodes a JSON request body with size limiting.
func decodeJSON(w http.ResponseWriter, r *http.Request, dst interface{}) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		return err
	}
	return nil
}

// writeAppError writes a structured error from a service AppError.
func writeAppError(w http.ResponseWriter, appErr *middleware.AppError) {
	middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
}

// DataResponse wraps the response data in a "data" field per API spec.
type DataResponse struct {
	Data interface{} `json:"data"`
}

// writeJSON writes a successful JSON response.
func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

// List handles GET /api/v1/books/{bookId}/reviews (public, API spec §17).
func (h *ReviewHandler) List(w http.ResponseWriter, r *http.Request) {
	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	reviews, err := h.repo.FindByBook(r.Context(), bookID)
	if err != nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong"))
		return
	}
	if reviews == nil {
		reviews = []Review{}
	}
	writeJSON(w, http.StatusOK, DataResponse{Data: reviews})
}

// Create handles POST /api/v1/books/{bookId}/reviews (auth required, API spec §17).
func (h *ReviewHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	var req ReviewRequest
	if err := decodeJSON(w, r, &req); err != nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusUnprocessableEntity, "VALIDATION_ERROR", "invalid request body"))
		return
	}
	if appErr := req.Validate(); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	review, err := h.repo.Create(r.Context(), userID, bookID, req.Content)
	if err != nil {
		if errors.Is(err, ErrDuplicateReview) {
			writeAppError(w, middleware.NewAppError(
				http.StatusConflict, "CONFLICT", "You have already reviewed this book"))
			return
		}
		writeAppError(w, middleware.NewAppError(
			http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong"))
		return
	}
	writeJSON(w, http.StatusCreated, DataResponse{Data: review})
}

// Update handles PUT /api/v1/reviews/{reviewId} (auth required, API spec §17).
func (h *ReviewHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	reviewID := r.PathValue("reviewId")

	var req ReviewRequest
	if err := decodeJSON(w, r, &req); err != nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusUnprocessableEntity, "VALIDATION_ERROR", "invalid request body"))
		return
	}
	if appErr := req.Validate(); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	updated, err := h.repo.Update(r.Context(), reviewID, userID, req.Content)
	if err != nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong"))
		return
	}
	if !updated {
		h.writeNotFoundOrForbidden(w, r, reviewID, userID)
		return
	}

	review, err := h.repo.FindByID(r.Context(), reviewID)
	if err != nil || review == nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong"))
		return
	}
	writeJSON(w, http.StatusOK, DataResponse{Data: review})
}

// Delete handles DELETE /api/v1/reviews/{reviewId} (auth required, API spec §17).
func (h *ReviewHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	reviewID := r.PathValue("reviewId")

	deleted, err := h.repo.Delete(r.Context(), reviewID, userID)
	if err != nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong"))
		return
	}
	if !deleted {
		h.writeNotFoundOrForbidden(w, r, reviewID, userID)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// writeNotFoundOrForbidden distinguishes 404 (review doesn't exist) from
// 403 (exists but belongs to someone else) — never leaks existence for
// foreign reviews via a different code path.
func (h *ReviewHandler) writeNotFoundOrForbidden(w http.ResponseWriter, r *http.Request, reviewID, userID string) {
	review, err := h.repo.FindByID(r.Context(), reviewID)
	if err != nil || review == nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusNotFound, "REVIEW_NOT_FOUND", "Review not found"))
		return
	}
	writeAppError(w, middleware.NewAppError(
		http.StatusForbidden, "FORBIDDEN", "You can only modify your own reviews"))
}
