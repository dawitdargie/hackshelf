package ratings

import (
	"encoding/json"
	"net/http"

	"hackshelf/backend/internal/auth"
	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/http/middleware"
)

// maxBodyBytes limits request body size (guards against oversized payloads).
const maxBodyBytes = 1 << 12 // 4 KB

// RatingHandler handles HTTP requests for book ratings.
type RatingHandler struct {
	repo        *RatingRepository
	bookService *books.BookService
}

// NewRatingHandler creates a new RatingHandler.
func NewRatingHandler(repo *RatingRepository, bookService *books.BookService) *RatingHandler {
	return &RatingHandler{repo: repo, bookService: bookService}
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

// Upsert handles PUT /api/v1/books/{bookId}/rating (auth required).
func (h *RatingHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req RatingRequest
	if err := decodeJSON(w, r, &req); err != nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusUnprocessableEntity, "VALIDATION_ERROR",
			"rating must be an integer between 1 and 5"))
		return
	}
	if appErr := req.Validate(); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	if err := h.repo.Upsert(r.Context(), userID, bookID, req.Rating); err != nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Delete handles DELETE /api/v1/books/{bookId}/rating (auth required).
// Idempotent: deleting a non-existent rating still returns 204.
func (h *RatingHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	if _, err := h.repo.Delete(r.Context(), userID, bookID); err != nil {
		writeAppError(w, middleware.NewAppError(
			http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
