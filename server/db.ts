import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set.",
  );
}

console.log("Connecting to database with URL:", databaseUrl.replace(/:[^:@]*@/, ':***@'));

// Configure postgres client
const client = postgres(databaseUrl, {
  prepare: false,
  max: 10,
  ssl: process.env.NODE_ENV === 'production',
  connection: {
    options: `--search_path=public`,
  },
});

export const db = drizzle(client, { schema });