-- Create sessions table for session storage
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Create users table with all required fields
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  email VARCHAR UNIQUE,
  phone VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  gender VARCHAR,
  age INTEGER,
  skin_type VARCHAR,
  skin_concerns JSONB,
  allergies JSONB,
  preferences JSONB,
  profile_completed BOOLEAN DEFAULT FALSE
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  brand VARCHAR,
  category VARCHAR,
  ingredients JSONB,
  image_url VARCHAR,
  image_data TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  compatibility_score INTEGER NOT NULL,
  compatibility_rating VARCHAR NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  purpose VARCHAR,
  benefits JSONB,
  concerns JSONB,
  safety_rating VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create SMS codes table
CREATE TABLE IF NOT EXISTS sms_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_codes ENABLE ROW LEVEL SECURITY;