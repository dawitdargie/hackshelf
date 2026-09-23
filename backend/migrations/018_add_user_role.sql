-- User roles for admin-only endpoints (admin catalog management).
-- 'user' is the default for every existing account. Promotion to 'admin' is a
-- deliberate DB operation (no self-service promotion path exists):
--
--   UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
