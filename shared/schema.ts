import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Skin profile data
  skinType: varchar("skin_type"), // oily, dry, combination, sensitive, normal
  skinConcerns: jsonb("skin_concerns"), // array of concerns like acne, aging, sensitivity
  allergies: jsonb("allergies"), // array of known allergies
  preferences: jsonb("preferences"), // vegan, cruelty-free, etc.
  profileCompleted: boolean("profile_completed").default(false),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  brand: text("brand"),
  category: varchar("category"), // moisturizer, serum, cleanser, etc.
  ingredients: jsonb("ingredients").notNull(), // array of ingredient objects
  imageUrl: text("image_url"),
  scannedAt: timestamp("scanned_at").defaultNow(),
  compatibilityScore: real("compatibility_score"), // 0-100
  compatibilityRating: varchar("compatibility_rating"), // excellent, good, caution, avoid
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  insights: jsonb("insights").notNull(), // AI-generated insights
  recommendations: jsonb("recommendations"), // AI recommendations
  ingredientBreakdown: jsonb("ingredient_breakdown").notNull(), // detailed ingredient analysis
  scoring: jsonb("scoring"), // product scoring data
  createdAt: timestamp("created_at").defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  commonNames: jsonb("common_names"), // array of alternative names
  purpose: text("purpose"), // moisturizer, antioxidant, etc.
  benefits: jsonb("benefits"), // array of benefits
  concerns: jsonb("concerns"), // array of potential concerns
  safetyRating: varchar("safety_rating"), // safe, caution, avoid
  description: text("description"),
});

// Email verification codes table
export const emailCodes = pgTable("email_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  analyses: many(analyses),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  product: one(products, {
    fields: [analyses.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [analyses.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  scannedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
});

export const insertEmailCodeSchema = createInsertSchema(emailCodes).omit({
  id: true,
  createdAt: true,
});

export const updateSkinProfileSchema = z.object({
  skinType: z.enum(["oily", "dry", "combination", "sensitive", "normal"]).optional(),
  skinConcerns: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertEmailCode = z.infer<typeof insertEmailCodeSchema>;
export type EmailCode = typeof emailCodes.$inferSelect;
export type UpdateSkinProfile = z.infer<typeof updateSkinProfileSchema>;
