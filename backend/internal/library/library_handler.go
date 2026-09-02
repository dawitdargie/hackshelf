package library

import (
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"

	"hackshelf/backend/internal/auth"
	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/http/middleware"
)

// maxBodyBytes limits request body size.
const maxBodyBytes = 1 << 12 // 4 KB

// Handler handles library (saved books) HTTP requests.
type Handler struct {
	repo        *LibraryRepository
	bookService *books.BookService
}

// NewHandler creates a new library Handler.
func NewHandler(repo *LibraryRepository, bookService *books.BookService) *Handler {
	return &Handler{repo: repo, bookService: bookService}
}

func writeAppError(w http.ResponseWriter, appErr *middleware.AppError) {
	middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
}

func writeInternal(w http.ResponseWriter, err error) {
	middleware.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
}

// SummaryResponse is the GET /me/library payload (API spec §19/§22).
type SummaryResponse struct {
	SavedBooks       []books.BookSummary `json:"saved_books"`
	CurrentlyReading []ReadingItem       `json:"currently_reading"`
	Progress         []ProgressEntry     `json:"progress"`
}

// Get handles GET /api/v1/me/library (auth required).
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	saved, err := h.repo.SavedBooks(r.Context(), userID)
	if err != nil {
		writeInternal(w, err)
		return
	}
	reading, err := h.repo.CurrentlyReading(r.Context(), userID, 10)
	if err != nil {
		writeInternal(w, err)
		return
	}
	progress, err := h.repo.AllProgress(r.Context(), userID)
	if err != nil {
		writeInternal(w, err)
		return
	}
	if saved == nil {
		saved = []books.BookSummary{}
	}
	if reading == nil {
		reading = []ReadingItem{}
	}
	if progress == nil {
		progress = []ProgressEntry{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"data": SummaryResponse{
		SavedBooks: saved, CurrentlyReading: reading, Progress: progress,
	}})
}

// Save handles POST /api/v1/me/library/{bookId} (auth required).
func (h *Handler) Save(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}
	if err := h.repo.Save(r.Context(), userID, bookID); err != nil {
		if errors.Is(err, ErrAlreadySaved) {
			writeAppError(w, middleware.NewAppError(http.StatusConflict, "CONFLICT", "Book is already saved"))
			return
		}
		writeInternal(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"data": map[string]string{
		"book_id": bookID, "status": "saved",
	}})
}

// Remove handles DELETE /api/v1/me/library/{bookId} (auth required). Idempotent 204.
func (h *Handler) Remove(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}
	if err := h.repo.Remove(r.Context(), userID, bookID); err != nil {
		writeInternal(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

var _ = pgx.ErrNoRows
