import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for database initialization.",
  );
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function initializeDatabase() {
  console.log('Initializing Supabase database schema...');
  
  try {
    // Create sessions table
    const { error: sessionsError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP NOT NULL
        );
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
      `
    });

    if (sessionsError) {
      console.error('Error creating sessions table:', sessionsError);
    }

    // Create users table
    const { error: usersError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
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
      `
    });

    if (usersError) {
      console.error('Error creating users table:', usersError);
    }

    // Create products table
    const { error: productsError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
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
      `
    });

    if (productsError) {
      console.error('Error creating products table:', productsError);
    }

    // Create analyses table
    const { error: analysesError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS analyses (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          compatibility_score INTEGER NOT NULL,
          compatibility_rating VARCHAR NOT NULL,
          analysis_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (analysesError) {
      console.error('Error creating analyses table:', analysesError);
    }

    // Create ingredients table
    const { error: ingredientsError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS ingredients (
          id SERIAL PRIMARY KEY,
          name VARCHAR UNIQUE NOT NULL,
          purpose VARCHAR,
          benefits JSONB,
          concerns JSONB,
          safety_rating VARCHAR,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (ingredientsError) {
      console.error('Error creating ingredients table:', ingredientsError);
    }

    // Create SMS codes table
    const { error: smsError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS sms_codes (
          id SERIAL PRIMARY KEY,
          phone VARCHAR NOT NULL,
          code VARCHAR NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (smsError) {
      console.error('Error creating sms_codes table:', smsError);
    }

    console.log('Database schema initialized successfully!');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}