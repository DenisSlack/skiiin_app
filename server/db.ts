import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Use Supabase database URL first, fallback to regular DATABASE_URL
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set.",
  );
}

console.log("Connecting to database with URL:", databaseUrl.replace(/:[^:@]*@/, ':***@'));

// Configure postgres client
const client = postgres(databaseUrl, {
  prepare: false,
  max: 10,
  ssl: 'require',
  connection: {
    options: `--search_path=public`,
  },
});

export const db = drizzle(client, { schema });