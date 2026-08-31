package auth

import (
	"encoding/json"
	"io"
	"net/http"

	"hackshelf/backend/internal/http/middleware"
)

// TokenHandler handles token management and password reset HTTP requests.
type TokenHandler struct {
	service *AuthService
}

// NewTokenHandler creates a new TokenHandler.
func NewTokenHandler(service *AuthService) *TokenHandler {
	return &TokenHandler{service: service}
}

// refreshTokenRequest is the request body carrying a refresh token.
type refreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// forgotPasswordRequest is the request body for forgot-password.
type forgotPasswordRequest struct {
	Email string `json:"email"`
}

// resetPasswordRequest is the request body for reset-password.
type resetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

// Refresh handles POST /api/v1/auth/refresh
func (h *TokenHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	req, appErr := decodeJSONBody[refreshTokenRequest](w, r)
	if appErr != nil {
		return
	}
	if req.RefreshToken == "" {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "refresh_token is required")
		return
	}

	resp, appErr := h.service.Refresh(r.Context(), req.RefreshToken)
	if appErr != nil {
		middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// Logout handles POST /api/v1/auth/logout (authentication required).
func (h *TokenHandler) Logout(w http.ResponseWriter, r *http.Request) {
	req, appErr := decodeJSONBody[refreshTokenRequest](w, r)
	if appErr != nil {
		return
	}
	if req.RefreshToken == "" {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "refresh_token is required")
		return
	}

	appErr = h.service.Logout(r.Context(), UserIDFromContext(r.Context()), req.RefreshToken)
	if appErr != nil {
		middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Me handles GET /api/v1/me (authentication required).
func (h *TokenHandler) Me(w http.ResponseWriter, r *http.Request) {
	user, appErr := h.service.Me(r.Context(), UserIDFromContext(r.Context()))
	if appErr != nil {
		middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
		return
	}

	writeJSON(w, http.StatusOK, user)
}

// ForgotPassword handles POST /api/v1/auth/forgot-password
func (h *TokenHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	req, appErr := decodeJSONBody[forgotPasswordRequest](w, r)
	if appErr != nil {
		return
	}
	if req.Email == "" {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "email is required")
		return
	}

	resp, appErr := h.service.ForgotPassword(r.Context(), req.Email)
	if appErr != nil {
		middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// ResetPassword handles POST /api/v1/auth/reset-password
func (h *TokenHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	req, appErr := decodeJSONBody[resetPasswordRequest](w, r)
	if appErr != nil {
		return
	}
	if req.Token == "" || req.Password == "" {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "token and password are required")
		return
	}

	if appErr := h.service.ResetPassword(r.Context(), req.Token, req.Password); appErr != nil {
		middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// decodeJSONBody decodes and closes a limited-size JSON request body into dst.
// Returns an error AppError and nil on failure (response already written).
func decodeJSONBody[T any](w http.ResponseWriter, r *http.Request) (*T, *middleware.AppError) {
	r.Body = http.MaxBytesReader(w, r.Body, 4096)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return nil, middleware.NewAppError(http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	var dst T
	if err := json.Unmarshal(body, &dst); err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return nil, middleware.NewAppError(http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	return &dst, nil
}

// writeJSON writes a successful response as {"data": ...}.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(dataResponse{Data: data})
}
