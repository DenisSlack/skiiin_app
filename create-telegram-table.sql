-- Create telegram_codes table for Telegram authentication
CREATE TABLE IF NOT EXISTS telegram_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(8) NOT NULL,
  telegram_message_id INTEGER,
  status INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_codes_phone_code ON telegram_codes(phone, code);
CREATE INDEX IF NOT EXISTS idx_telegram_codes_expires_at ON telegram_codes(expires_at);