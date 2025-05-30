import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set. Please provide Supabase database connection string.",
  );
}

// Configure postgres client for Supabase
const client = postgres(databaseUrl, {
  prepare: false,
  max: 10,
});

export const db = drizzle(client, { schema });