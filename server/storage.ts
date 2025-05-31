import {
  users,
  products,
  analyses,
  ingredients,
  smsCodes,
  telegramCodes,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Analysis,
  type InsertAnalysis,
  type Ingredient,
  type InsertIngredient,
  type UpdateSkinProfile,
  type LoginCredentials,
  type RegisterData,
  type InsertSmsCode,
  type SmsCode,
  type InsertTelegramCode,
  type TelegramCode,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(userData: RegisterData): Promise<User>;
  createUserWithPhone(phone: string): Promise<User>;
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
  
  // SMS code operations
  createSmsCode(smsCode: InsertSmsCode): Promise<SmsCode>;
  getValidSmsCode(phone: string, code: string): Promise<SmsCode | undefined>;
  markSmsCodeAsVerified(id: number): Promise<void>;
  cleanupExpiredSmsCodes(): Promise<void>;
  
  // Telegram code operations
  createTelegramCode(telegramCode: InsertTelegramCode): Promise<TelegramCode>;
  getValidTelegramCode(phone: string, code: string): Promise<TelegramCode | undefined>;
  markTelegramCodeAsVerified(id: number): Promise<void>;
  updateTelegramCodeStatus(id: number, status: number, extendStatus?: string): Promise<void>;
  cleanupExpiredTelegramCodes(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, phone));
    return user;
  }

  async createUser(userData: RegisterData): Promise<User> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        username: userData.username,
        password: userData.password, // In production, hash this password
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: null,
      })
      .returning();
    return user;
  }

  async createUserWithPhone(phone: string): Promise<User> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const username = `phone_${phone.replace(/\D/g, '')}`;
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        username: username,
        password: phone, // Use phone as temporary password
        email: phone, // Store phone in email field for now
        firstName: null,
        lastName: null,
        profileImageUrl: null,
      })
      .returning();
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
      .orderBy(desc(products.createdAt));
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

  // SMS code operations
  async createSmsCode(smsCode: InsertSmsCode): Promise<SmsCode> {
    const [code] = await db
      .insert(smsCodes)
      .values(smsCode)
      .returning();
    return code;
  }

  async getValidSmsCode(phone: string, code: string): Promise<SmsCode | undefined> {
    const [smsCode] = await db
      .select()
      .from(smsCodes)
      .where(
        and(
          eq(smsCodes.phone, phone),
          eq(smsCodes.code, code),
          eq(smsCodes.verified, false)
        )
      )
      .orderBy(desc(smsCodes.createdAt));
    
    if (!smsCode) return undefined;
    
    // Check if code is expired
    if (new Date() > smsCode.expiresAt) {
      return undefined;
    }
    
    return smsCode;
  }

  async markSmsCodeAsVerified(id: number): Promise<void> {
    await db
      .update(smsCodes)
      .set({ verified: true })
      .where(eq(smsCodes.id, id));
  }

  async cleanupExpiredSmsCodes(): Promise<void> {
    await db
      .delete(smsCodes)
      .where(eq(smsCodes.verified, true));
  }
}

// Use Supabase API storage for better reliability
import { SupabaseStorage } from './supabaseStorage';

export const storage = new SupabaseStorage();
