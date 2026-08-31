package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"hackshelf/backend/internal/email"
	"hackshelf/backend/internal/http/middleware"
	"hackshelf/backend/internal/users"
	"net/http"
)

// AuthService handles authentication business logic.
type AuthService struct {
	userService        *users.UserService
	refreshTokenRepo   *RefreshTokenRepository
	emailSender        email.EmailSender
	jwtAccessSecret    string
	jwtRefreshSecret   string
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
}

// NewAuthService creates a new AuthService.
func NewAuthService(
	userService *users.UserService,
	refreshTokenRepo *RefreshTokenRepository,
	emailSender email.EmailSender,
	jwtAccessSecret, jwtRefreshSecret string,
	accessTokenExpiry, refreshTokenExpiry time.Duration,
) *AuthService {
	return &AuthService{
		userService:        userService,
		refreshTokenRepo:   refreshTokenRepo,
		emailSender:        emailSender,
		jwtAccessSecret:    jwtAccessSecret,
		jwtRefreshSecret:   jwtRefreshSecret,
		accessTokenExpiry:  accessTokenExpiry,
		refreshTokenExpiry: refreshTokenExpiry,
	}
}

// AuthResponse is the response returned after signup or login.
type AuthResponse struct {
	User         users.User `json:"user"`
	AccessToken  string     `json:"access_token"`
	RefreshToken string     `json:"refresh_token"`
}

// Signup registers a new user and returns tokens.
func (s *AuthService) Signup(ctx context.Context, username, email, password string) (*AuthResponse, *middleware.AppError) {
	// Validate input
	if appErr := s.userService.ValidateSignup(username, email, password); appErr != nil {
		return nil, appErr
	}

	// Check duplicates
	if appErr := s.userService.CheckDuplicates(ctx, username, email); appErr != nil {
		return nil, appErr
	}

	// Hash password
	passwordHash, err := HashPassword(password)
	if err != nil {
		return nil, middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}

	// Create user
	user, appErr := s.userService.Create(ctx, username, email, passwordHash)
	if appErr != nil {
		return nil, appErr
	}

	// Generate tokens
	accessToken, appErr := s.generateAccessToken(user.ID)
	if appErr != nil {
		return nil, appErr
	}

	refreshToken, appErr := s.generateAndStoreRefreshToken(ctx, user.ID)
	if appErr != nil {
		return nil, appErr
	}

	return &AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// Login authenticates a user and returns tokens.
func (s *AuthService) Login(ctx context.Context, email, password string) (*AuthResponse, *middleware.AppError) {
	// Find user by email
	user, appErr := s.userService.FindByEmail(ctx, email)
	if appErr != nil {
		return nil, appErr
	}
	if user == nil {
		return nil, middleware.NewAppError(http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
	}

	// Verify password
	if !VerifyPassword(password, user.PasswordHash) {
		return nil, middleware.NewAppError(http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
	}

	// Generate tokens
	accessToken, appErr := s.generateAccessToken(user.ID)
	if appErr != nil {
		return nil, appErr
	}

	refreshToken, appErr := s.generateAndStoreRefreshToken(ctx, user.ID)
	if appErr != nil {
		return nil, appErr
	}

	return &AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// generateAccessToken creates a JWT access token for the given user ID.
func (s *AuthService) generateAccessToken(userID string) (string, *middleware.AppError) {
	token, err := GenerateAccessToken(userID, s.jwtAccessSecret, s.accessTokenExpiry)
	if err != nil {
		return "", middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	return token, nil
}

// generateAndStoreRefreshToken creates a random refresh token, hashes it, and stores the hash.
func (s *AuthService) generateAndStoreRefreshToken(ctx context.Context, userID string) (string, *middleware.AppError) {
	// Generate random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	refreshToken := base64.RawURLEncoding.EncodeToString(tokenBytes)

	// Hash the token (SHA-256) for storage
	tokenHash := hashToken(refreshToken)

	// Store in database
	expiresAt := time.Now().Add(s.refreshTokenExpiry)
	if err := s.refreshTokenRepo.Create(ctx, userID, tokenHash, expiresAt); err != nil {
		return "", middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}

	return refreshToken, nil
}

// hashToken returns the SHA-256 hex hash of a token.
func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", h)
}

// TokenResponse is the response returned after a token refresh.
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// Refresh validates a refresh token and issues new access/refresh tokens.
// The old refresh token is revoked (rotation).
func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*TokenResponse, *middleware.AppError) {
	tokenHash := hashToken(refreshToken)

	userID, err := s.refreshTokenRepo.FindByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}
	if userID == "" {
		return nil, middleware.NewAppError(http.StatusUnauthorized, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token")
	}

	// Issue new tokens first, then revoke the old one.
	accessToken, appErr := s.generateAccessToken(userID)
	if appErr != nil {
		return nil, appErr
	}

	newRefreshToken, appErr := s.generateAndStoreRefreshToken(ctx, userID)
	if appErr != nil {
		return nil, appErr
	}

	if err := s.refreshTokenRepo.Revoke(ctx, tokenHash); err != nil {
		return nil, middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

// Logout revokes the given refresh token if it exists and belongs to the
// authenticated user.
func (s *AuthService) Logout(ctx context.Context, userID, refreshToken string) *middleware.AppError {
	tokenHash := hashToken(refreshToken)

	ownerID, err := s.refreshTokenRepo.FindByTokenHash(ctx, tokenHash)
	if err != nil {
		return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}

	// Only revoke tokens that belong to the authenticated user.
	if ownerID != "" && ownerID == userID {
		if err := s.refreshTokenRepo.Revoke(ctx, tokenHash); err != nil {
			return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
		}
	}

	return nil
}

// Me returns the authenticated user's profile.
func (s *AuthService) Me(ctx context.Context, userID string) (*users.User, *middleware.AppError) {
	user, appErr := s.userService.FindByID(ctx, userID)
	if appErr != nil {
		return nil, appErr
	}
	if user == nil {
		return nil, middleware.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token")
	}
	return user, nil
}
