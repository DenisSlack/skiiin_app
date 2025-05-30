import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide Supabase database connection string.",
  );
}

// Configure postgres client for Supabase
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 10,
});

export const db = drizzle(client, { schema });