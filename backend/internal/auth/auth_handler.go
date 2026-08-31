package auth

import (
	"encoding/json"
	"io"
	"net/http"

	"hackshelf/backend/internal/http/middleware"
)

// AuthHandler handles HTTP requests for authentication.
type AuthHandler struct {
	service *AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(service *AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

// signupRequest is the request body for signup.
type signupRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// loginRequest is the request body for login.
type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// dataResponse wraps the response data in a "data" field per API spec.
type dataResponse struct {
	Data interface{} `json:"data"`
}

// Signup handles POST /api/v1/auth/signup
func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	// Limit body size
	r.Body = http.MaxBytesReader(w, r.Body, 4096)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	var req signupRequest
	if err := json.Unmarshal(body, &req); err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	// Check all fields are present
	if req.Username == "" || req.Email == "" || req.Password == "" {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Username, email, and password are required")
		return
	}

	resp, appErr := h.service.Signup(r.Context(), req.Username, req.Email, req.Password)
	if appErr != nil {
		middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
		return
	}

	writeAuthResponse(w, http.StatusCreated, resp)
}

// Login handles POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// Limit body size
	r.Body = http.MaxBytesReader(w, r.Body, 4096)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	var req loginRequest
	if err := json.Unmarshal(body, &req); err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	// Check all fields are present
	if req.Email == "" || req.Password == "" {
		middleware.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Email and password are required")
		return
	}

	resp, appErr := h.service.Login(r.Context(), req.Email, req.Password)
	if appErr != nil {
		middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
		return
	}

	writeAuthResponse(w, http.StatusOK, resp)
}

// writeAuthResponse writes a successful auth response as JSON.
func writeAuthResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(dataResponse{Data: data})
}
