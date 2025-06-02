-- Create sessions table for session storage
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY NOT NULL,
  "username" varchar UNIQUE NOT NULL,
  "password" varchar NOT NULL,
  "email" varchar UNIQUE,
  "first_name" varchar,
  "last_name" varchar,
  "profile_image_url" varchar,
  "telegram_id" varchar UNIQUE,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW(),
  -- Personal data
  "gender" varchar,
  "age" integer,
  -- Skin profile data
  "skin_type" varchar,
  "skin_concerns" jsonb,
  "allergies" jsonb,
  "preferences" jsonb,
  "profile_completed" boolean DEFAULT false
);

-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES users(id),
  "name" text NOT NULL,
  "brand" text,
  "category" varchar,
  "ingredients" jsonb NOT NULL,
  "image_url" text,
  "image_data" text,
  "created_at" timestamp DEFAULT NOW(),
  "compatibility_score" real,
  "compatibility_rating" varchar
);

-- Create analyses table
CREATE TABLE IF NOT EXISTS "analyses" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES products(id),
  "user_id" varchar NOT NULL REFERENCES users(id),
  "compatibility_score" integer NOT NULL,
  "compatibility_rating" varchar NOT NULL,
  "analysis_data" jsonb NOT NULL,
  "created_at" timestamp DEFAULT NOW()
);

-- Create SMS verification codes table
CREATE TABLE IF NOT EXISTS "sms_codes" (
  "id" serial PRIMARY KEY,
  "phone" varchar(20) NOT NULL,
  "code" varchar(6) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "verified" boolean DEFAULT false,
  "created_at" timestamp DEFAULT NOW()
); 