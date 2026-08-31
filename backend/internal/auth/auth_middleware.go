package auth

import (
	"context"
	"net/http"
	"strings"

	"hackshelf/backend/internal/http/middleware"
)

// contextKey is a private type for context keys in this package.
type contextKey string

// userIDContextKey is the context key holding the authenticated user's ID.
const userIDContextKey contextKey = "userID"

// UserIDFromContext returns the authenticated user's ID from the request context.
// Returns an empty string if no user ID is present.
func UserIDFromContext(ctx context.Context) string {
	if userID, ok := ctx.Value(userIDContextKey).(string); ok {
		return userID
	}
	return ""
}

// AuthMiddleware validates the Authorization: Bearer <token> header,
// attaches the user ID to the request context, and rejects
// missing/invalid tokens with 401 Unauthorized.
func AuthMiddleware(jwtAccessSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				middleware.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing Authorization header")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
				middleware.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid Authorization header format")
				return
			}

			userID, err := ValidateAccessToken(parts[1], jwtAccessSecret)
			if err != nil {
				middleware.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), userIDContextKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
