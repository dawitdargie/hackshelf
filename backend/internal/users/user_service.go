package users

import (
	"context"
	"regexp"
	"strings"

	"hackshelf/backend/internal/http/middleware"
	"net/http"
)

// UserService handles user business logic.
type UserService struct {
	repo *UserRepository
}

// NewUserService creates a new UserService.
func NewUserService(repo *UserRepository) *UserService {
	return &UserService{repo: repo}
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)

// ValidateSignup validates signup input and returns an error if invalid.
// Returns *AppError with status 422 on validation failure.
func (s *UserService) ValidateSignup(username, email, password string) *middleware.AppError {
	username = strings.TrimSpace(username)
	email = strings.TrimSpace(email)

	if len(username) < 3 || len(username) > 50 {
		return middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Username must be 3-50 characters")
	}
	if !usernameRegex.MatchString(username) {
		return middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Username can only contain letters, numbers, and underscores")
	}
	if !emailRegex.MatchString(email) {
		return middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Invalid email address")
	}
	if len(password) < 8 {
		return middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Password must be at least 8 characters")
	}

	return nil
}

// CheckDuplicates checks if email or username already exists.
// Returns an AppError with 409 on conflict, or nil if no duplicates.
func (s *UserService) CheckDuplicates(ctx context.Context, username, email string) *middleware.AppError {
	existing, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	if existing != nil {
		return middleware.NewAppError(http.StatusConflict, "EMAIL_TAKEN", "Email already registered")
	}

	existing, err = s.repo.FindByUsername(ctx, username)
	if err != nil {
		return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	if existing != nil {
		return middleware.NewAppError(http.StatusConflict, "USERNAME_TAKEN", "Username already taken")
	}

	return nil
}

// Create creates a new user in the database.
func (s *UserService) Create(ctx context.Context, username, email, passwordHash string) (*User, *middleware.AppError) {
	user, err := s.repo.Create(ctx, username, email, passwordHash)
	if err != nil {
		return nil, middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	return user, nil
}

// FindByEmail finds a user by email (returns user or nil if not found).
func (s *UserService) FindByEmail(ctx context.Context, email string) (*User, *middleware.AppError) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return nil, middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	return user, nil
}

// FindByID finds a user by ID (returns user or nil if not found).
func (s *UserService) FindByID(ctx context.Context, id string) (*User, *middleware.AppError) {
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	return user, nil
}

// ValidatePassword validates a new password and returns an error if invalid.
func (s *UserService) ValidatePassword(password string) *middleware.AppError {
	if len(password) < 8 {
		return middleware.NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Password must be at least 8 characters")
	}
	return nil
}

// UpdatePassword updates a user's password hash in the database.
func (s *UserService) UpdatePassword(ctx context.Context, userID, passwordHash string) *middleware.AppError {
	if err := s.repo.UpdatePassword(ctx, userID, passwordHash); err != nil {
		return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	return nil
}
