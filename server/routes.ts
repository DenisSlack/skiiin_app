import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import { analyzeIngredientsWithPerplexity, findProductIngredients, generatePartnerRecommendations, findProductImage, getPersonalizedRecommendation } from "./perplexity";
import { extractIngredientsFromText } from "./gemini";
import { scoreProduct } from "./scoring";
import { scoreAdvancedProduct } from "./advancedScoring";
import { insertProductSchema, insertAnalysisSchema, updateSkinProfileSchema, loginSchema, registerSchema, smsLoginSchema, smsVerifySchema, telegramLoginSchema, telegramVerifySchema } from "@shared/schema";
import { sendSMSCode, generateSMSCode } from "./smsService";
import { sendTelegramCode, generateTelegramCode, checkTelegramCodeStatus } from "./telegramService";
import { memoryCodeStorage } from "./memoryCodeStorage";
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Ошибка валидации", 
          errors: result.error.issues 
        });
      }

      const { username, password, email, firstName, lastName } = result.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingEmailUser = await storage.getUserByEmail(email);
        if (existingEmailUser) {
          return res.status(400).json({ message: "Пользователь с таким email уже существует" });
        }
      }

      // Create user
      const user = await storage.createUser({
        username,
        password,
        email,
        firstName,
        lastName,
      });

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;

      res.json({ user, message: "Регистрация прошла успешно" });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Ошибка регистрации" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Ошибка валидации", 
          errors: result.error.issues 
        });
      }

      const { username, password } = result.data;

      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ message: "Неверный логин или пароль" });
      }

      // Check password
      if (user.password !== password) {
        return res.status(400).json({ message: "Неверный логин или пароль" });
      }

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;
      
      // Force session save and provide a temporary token
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
        }
        
        console.log("Session after login:", req.session);
        
        const tempToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
        res.json({ 
          user, 
          message: "Вход выполнен успешно",
          token: tempToken
        });
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Ошибка входа" });
    }
  });

  app.get('/api/auth/session', async (req: any, res) => {
    try {
      if (req.session?.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          return res.json(user);
        }
      }
      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching session user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Add /api/auth/user endpoint that mirrors /api/auth/session
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (req.session?.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          return res.json(user);
        }
      }
      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка выхода" });
      }
      res.json({ message: "Выход выполнен успешно" });
    });
  });

  // Protected routes
  app.get('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Product and Analysis routes
  app.get('/api/products/:id', requireAuth, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get('/api/analysis/user', requireAuth, async (req: any, res) => {
    try {
      const analyses = await storage.getUserAnalyses(req.user.id);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching user analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  app.post('/api/analysis', requireAuth, async (req: any, res) => {
    try {
      const { productId, ingredientList } = req.body;
      
      // Get product details
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Analyze ingredients
      const analysis = await analyzeIngredientsWithPerplexity(ingredientList);
      
      // Save analysis
      const savedAnalysis = await storage.createAnalysis({
        productId,
        userId: req.user.id,
        compatibilityScore: analysis.compatibilityScore,
        compatibilityRating: analysis.compatibilityRating,
        analysisData: analysis
      });

      res.json({ 
        analysis: savedAnalysis,
        result: analysis
      });
    } catch (error) {
      console.error("Error creating analysis:", error);
      res.status(500).json({ message: "Failed to create analysis" });
    }
  });

  app.post('/api/analysis/personal-recommendation', requireAuth, async (req: any, res) => {
    try {
      const { productName, ingredients, skinProfile } = req.body;
      const recommendation = await getPersonalizedRecommendation(productName, ingredients, skinProfile);
      res.json({ recommendation });
    } catch (error) {
      console.error("Error getting personal recommendation:", error);
      res.status(500).json({ message: "Failed to get recommendation" });
    }
  });

  app.post('/api/products/find-ingredients', requireAuth, async (req: any, res) => {
    try {
      const { productName } = req.body;
      
      if (!productName || typeof productName !== 'string') {
        return res.status(400).json({ message: "Product name is required" });
      }

      console.log("Finding ingredients for product:", productName);
      
      const ingredients = await findProductIngredients(productName);
      
      console.log("Found ingredients:", ingredients);
      
      if (!ingredients) {
        return res.status(404).json({ 
          message: "Ingredients not found",
          ingredients: "" 
        });
      }
      
      res.json({ ingredients });
    } catch (error) {
      console.error("Error finding ingredients:", error);
      res.status(500).json({ 
        message: "Failed to find ingredients",
        ingredients: "" 
      });
    }
  });

  return server;
}
