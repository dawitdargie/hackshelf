package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GenerateAccessToken creates a signed JWT access token for the given user ID.
// The token expires after the given duration and is signed with HS256.
func GenerateAccessToken(userID, secret string, expiry time.Duration) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub": userID,
		"iat": now.Unix(),
		"exp": now.Add(expiry).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign access token: %w", err)
	}

	return signed, nil
}

// ValidateAccessToken validates a JWT access token and returns the user ID.
// Returns an error if the token is invalid or expired.
func ValidateAccessToken(tokenString, secret string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return "", fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("invalid token claims")
	}

	userID, ok := claims["sub"].(string)
	if !ok {
		return "", fmt.Errorf("invalid subject claim")
	}

	return userID, nil
}

// ParseExpiry parses a duration string like "15m", "7d", "1h".
// Supports: s (seconds), m (minutes), h (hours), d (days).
func ParseExpiry(s string) (time.Duration, error) {
	if len(s) < 2 {
		return 0, fmt.Errorf("invalid expiry format: %s", s)
	}

	unit := s[len(s)-1]
	value := s[:len(s)-1]

	var hours float64
	_, err := fmt.Sscanf(value, "%f", &hours)
	if err != nil {
		return 0, fmt.Errorf("invalid expiry value: %s", s)
	}

	switch unit {
	case 's':
		return time.Duration(hours * float64(time.Second)), nil
	case 'm':
		return time.Duration(hours * float64(time.Minute)), nil
	case 'h':
		return time.Duration(hours * float64(time.Hour)), nil
	case 'd':
		return time.Duration(hours * 24 * float64(time.Hour)), nil
	default:
		return 0, fmt.Errorf("invalid expiry unit: %c", unit)
	}
}
