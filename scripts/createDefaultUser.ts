import { db } from "../server/db";
import { users } from "../shared/schema";

async function createDefaultUser() {
  try {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        username: "admin",
        password: "admin123",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        profileCompleted: true,
      })
      .returning();

    console.log("Default user created:", user);
    process.exit(0);
  } catch (error) {
    console.error("Error creating default user:", error);
    process.exit(1);
  }
}

createDefaultUser(); 