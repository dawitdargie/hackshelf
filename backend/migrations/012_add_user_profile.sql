-- 012_add_user_profile.sql
-- Adds editable profile fields to the users table. Email remains read-only.
-- display_name: public display name; empty means use username. Max 50 chars.
-- bio: free-form bio, up to 500 chars at the application layer.
-- Both are NOT NULL with empty-string defaults so Go string scans never see NULL.

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
UPDATE users SET bio = '' WHERE bio IS NULL;
ALTER TABLE users ALTER COLUMN bio SET DEFAULT '';
ALTER TABLE users ALTER COLUMN bio SET NOT NULL;
