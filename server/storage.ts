import {
  users,
  products,
  analyses,
  ingredients,
  emailCodes,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Analysis,
  type InsertAnalysis,
  type Ingredient,
  type InsertIngredient,
  type InsertEmailCode,
  type EmailCode,
  type UpdateSkinProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateSkinProfile(userId: string, profile: UpdateSkinProfile): Promise<User>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getUserProducts(userId: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  deleteProduct(id: number, userId: string): Promise<void>;
  
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getProductAnalyses(productId: number): Promise<Analysis[]>;
  getUserAnalyses(userId: string): Promise<Analysis[]>;
  
  // Ingredient operations
  getIngredient(name: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  searchIngredients(query: string): Promise<Ingredient[]>;
  
  // Email code operations
  createEmailCode(emailCode: InsertEmailCode): Promise<EmailCode>;
  getValidEmailCode(email: string, code: string): Promise<EmailCode | undefined>;
  markEmailCodeAsVerified(id: number): Promise<void>;
  cleanupExpiredCodes(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateSkinProfile(userId: string, profile: UpdateSkinProfile): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profile,
        profileCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getUserProducts(userId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.scannedAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async deleteProduct(id: number, userId: string): Promise<void> {
    await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)));
  }

  // Analysis operations
  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [newAnalysis] = await db.insert(analyses).values(analysis).returning();
    return newAnalysis;
  }

  async getProductAnalyses(productId: number): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.productId, productId))
      .orderBy(desc(analyses.createdAt));
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt));
  }

  // Ingredient operations
  async getIngredient(name: string): Promise<Ingredient | undefined> {
    const [ingredient] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.name, name));
    return ingredient;
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [newIngredient] = await db
      .insert(ingredients)
      .values(ingredient)
      .returning();
    return newIngredient;
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    // Simple text search - in production you might want to use full-text search
    return await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.name, query))
      .limit(10);
  }
}

export const storage = new DatabaseStorage();
