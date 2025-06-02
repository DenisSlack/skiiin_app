import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function recreateSessionTable() {
  try {
    // Drop existing table
    await db.execute(sql`DROP TABLE IF EXISTS sessions CASCADE`);

    // Create new table with correct structure
    await db.execute(sql`
      CREATE TABLE "sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX "IDX_session_expire" ON "sessions" ("expire");
    `);

    console.log("Session table recreated successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error recreating session table:", error);
    process.exit(1);
  }
}

recreateSessionTable(); 