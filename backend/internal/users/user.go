package users

import (
	"time"
)

// User represents a registered user.
// PasswordHash is never serialized to JSON. Email is read-only in v1
// (changing email requires re-verification — a later enhancement);
// display_name and bio are editable profile fields.
type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	DisplayName  string    `json:"display_name"`
	Bio          string    `json:"bio"`
	Role         string    `json:"role"` // "user" | "admin" — gates /api/v1/admin routes
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
