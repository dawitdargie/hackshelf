package users

import (
"context"
"fmt"
"time"

"github.com/jackc/pgx/v5"
"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository handles database operations for users.
type UserRepository struct {
pool *pgxpool.Pool
}

// NewUserRepository creates a new UserRepository.
func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
return &UserRepository{pool: pool}
}

// Create inserts a new user into the database.
func (r *UserRepository) Create(ctx context.Context, username, email, passwordHash string) (*User, error) {
user := &User{
Username:     username,
Email:        email,
PasswordHash: passwordHash,
}

err := r.pool.QueryRow(ctx,
`INSERT INTO users (username, email, password_hash)
 VALUES ($1, $2, $3)
 RETURNING id, username, email, password_hash, display_name, bio, role, created_at, updated_at`,
username, email, passwordHash,
).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.DisplayName, &user.Bio, &user.Role, &user.CreatedAt, &user.UpdatedAt)

if err != nil {
return nil, fmt.Errorf("failed to create user: %w", err)
}

return user, nil
}

// FindByEmail finds a user by email.
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*User, error) {
user, err := r.scanUser(ctx,
`SELECT id, username, email, password_hash, display_name, bio, role, created_at, updated_at
 FROM users WHERE email = $1`,
email,
)
if err != nil {
if err == pgx.ErrNoRows {
return nil, nil
}
return nil, err
}
return user, nil
}

// FindByUsername finds a user by username.
func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*User, error) {
user, err := r.scanUser(ctx,
`SELECT id, username, email, password_hash, display_name, bio, role, created_at, updated_at
 FROM users WHERE username = $1`,
username,
)
if err != nil {
if err == pgx.ErrNoRows {
return nil, nil
}
return nil, err
}
return user, nil
}

// FindByID finds a user by ID.
func (r *UserRepository) FindByID(ctx context.Context, id string) (*User, error) {
user, err := r.scanUser(ctx,
`SELECT id, username, email, password_hash, display_name, bio, role, created_at, updated_at
 FROM users WHERE id = $1`,
id,
)
if err != nil {
if err == pgx.ErrNoRows {
return nil, nil
}
return nil, err
}
return user, nil
}

// UpdatePassword updates a user's password hash and refreshes updated_at.
func (r *UserRepository) UpdatePassword(ctx context.Context, id, passwordHash string) error {
_, err := r.pool.Exec(ctx,
`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
passwordHash, id,
)
if err != nil {
return fmt.Errorf("failed to update password: %w", err)
}
return nil
}

// UpdateProfile updates a user's display_name and bio fields.
func (r *UserRepository) UpdateProfile(ctx context.Context, id, displayName, bio string) error {
_, err := r.pool.Exec(ctx,
`UPDATE users SET display_name = $1, bio = $2, updated_at = NOW() WHERE id = $3`,
displayName, bio, id,
)
if err != nil {
return fmt.Errorf("failed to update profile: %w", err)
}
return nil
}

// scanUser scans a user row from a query.
func (r *UserRepository) scanUser(ctx context.Context, query string, args ...interface{}) (*User, error) {
user := &User{}
err := r.pool.QueryRow(ctx, query, args...).Scan(
&user.ID, &user.Username, &user.Email, &user.PasswordHash,
&user.DisplayName, &user.Bio, &user.Role, &user.CreatedAt, &user.UpdatedAt,
)
if err != nil {
return nil, err
}
return user, nil
}

// UpdateRole sets a user's role ("user" or "admin").
func (r *UserRepository) UpdateRole(ctx context.Context, id, role string) error {
_, err := r.pool.Exec(ctx,
`UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`,
role, id,
)
if err != nil {
return fmt.Errorf("failed to update role: %w", err)
}
return nil
}

// updateTimestamps is used by future methods to refresh updated_at.
func (r *UserRepository) updateTimestamps(ctx context.Context, id string) error {
_, err := r.pool.Exec(ctx,
`UPDATE users SET updated_at = $1 WHERE id = $2`,
time.Now(), id,
)
return err
}
