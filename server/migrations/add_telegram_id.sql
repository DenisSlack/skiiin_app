-- Add telegram_id column to users table
ALTER TABLE users ADD COLUMN telegram_id VARCHAR(50) UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_users_telegram_id ON users(telegram_id); 