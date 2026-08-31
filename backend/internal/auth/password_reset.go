package auth

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"hackshelf/backend/internal/http/middleware"

	"github.com/golang-jwt/jwt/v5"
)

// resetTokenPurpose identifies JWTs issued for password resets.
const resetTokenPurpose = "password_reset"

// resetTokenExpiry is how long a password reset token is valid.
const resetTokenExpiry = time.Hour

// ForgotPasswordResponse is the generic response for forgot-password.
type ForgotPasswordResponse struct {
	Message string `json:"message"`
}

// generateResetToken creates a signed JWT password reset token for the user.
func generateResetToken(userID, secret string) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":     userID,
		"purpose": resetTokenPurpose,
		"iat":     now.Unix(),
		"exp":     now.Add(resetTokenExpiry).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign reset token: %w", err)
	}
	return signed, nil
}

// validateResetToken validates a password reset JWT and returns the user ID.
func validateResetToken(tokenString, secret string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return "", fmt.Errorf("invalid reset token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("invalid reset token claims")
	}

	if purpose, ok := claims["purpose"].(string); !ok || purpose != resetTokenPurpose {
		return "", fmt.Errorf("invalid reset token purpose")
	}

	userID, ok := claims["sub"].(string)
	if !ok || userID == "" {
		return "", fmt.Errorf("invalid reset token subject")
	}

	return userID, nil
}

// ForgotPassword handles a forgot-password request. It always returns a
// generic response to prevent account enumeration. If the user exists,
// a reset token is generated and dispatched via the email service.
func (s *AuthService) ForgotPassword(ctx context.Context, emailAddr string) (*ForgotPasswordResponse, *middleware.AppError) {
	user, err := s.userService.FindByEmail(ctx, emailAddr)
	if err != nil {
		return nil, err
	}

	if user != nil {
		resetToken, err := generateResetToken(user.ID, s.jwtRefreshSecret)
		if err != nil {
			return nil, middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
		}

		if err := s.emailSender.SendPasswordReset(ctx, user.Email, resetToken); err != nil {
			return nil, middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
		}
	}

	return &ForgotPasswordResponse{
		Message: "If an account exists for this email, instructions have been sent.",
	}, nil
}

// ResetPassword validates a reset token, updates the user's password,
// and revokes all their refresh tokens. Returns nil appErr on success.
func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) *middleware.AppError {
	// Validate password strength first (cheap check before JWT validation).
	if appErr := s.userService.ValidatePassword(newPassword); appErr != nil {
		return appErr
	}

	userID, err := validateResetToken(token, s.jwtRefreshSecret)
	if err != nil {
		return middleware.NewAppError(http.StatusUnauthorized, "INVALID_RESET_TOKEN", "Invalid or expired reset token")
	}

	// Confirm the user still exists.
	user, appErr := s.userService.FindByID(ctx, userID)
	if appErr != nil {
		return appErr
	}
	if user == nil {
		return middleware.NewAppError(http.StatusUnauthorized, "INVALID_RESET_TOKEN", "Invalid or expired reset token")
	}

	// Hash the new password with Argon2id.
	passwordHash, hashErr := HashPassword(newPassword)
	if hashErr != nil {
		return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}

	// Update the password.
	if appErr := s.userService.UpdatePassword(ctx, userID, passwordHash); appErr != nil {
		return appErr
	}

	// Invalidate all existing sessions.
	if err := s.refreshTokenRepo.RevokeAllForUser(ctx, userID); err != nil {
		return middleware.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
	}

	return nil
}
