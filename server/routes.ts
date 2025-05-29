import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeIngredients, extractIngredientsFromText, generateProductRecommendations } from "./openai";
import { insertProductSchema, insertAnalysisSchema, updateSkinProfileSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Skin profile routes
  app.put('/api/profile/skin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = updateSkinProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateSkinProfile(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating skin profile:", error);
      res.status(400).json({ message: "Failed to update skin profile" });
    }
  });

  // Product routes
  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productData = insertProductSchema.parse({
        ...req.body,
        userId,
      });

      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getUserProducts(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if user owns this product
      if (product.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = parseInt(req.params.id);
      
      await storage.deleteProduct(productId, userId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Analysis routes
  app.post('/api/analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId, ingredientList } = req.body;

      // Get user's skin profile for personalized analysis
      const user = await storage.getUser(userId);
      const skinProfile = user?.skinType ? {
        skinType: user.skinType,
        skinConcerns: (user.skinConcerns as string[]) || [],
        allergies: (user.allergies as string[]) || [],
        preferences: (user.preferences as string[]) || [],
      } : undefined;

      // Analyze ingredients using AI
      const analysisResult = await analyzeIngredients(ingredientList, skinProfile);

      // Update product with compatibility score
      const product = await storage.getProduct(productId);
      if (product && product.userId === userId) {
        await storage.createProduct({
          ...product,
          compatibilityScore: analysisResult.compatibilityScore,
          compatibilityRating: analysisResult.compatibilityRating,
          ingredients: analysisResult.ingredients,
        });
      }

      // Save analysis
      const analysisData = insertAnalysisSchema.parse({
        productId,
        userId,
        insights: analysisResult.insights,
        recommendations: analysisResult.insights.recommendations,
        ingredientBreakdown: analysisResult.ingredients,
      });

      const analysis = await storage.createAnalysis(analysisData);
      
      res.json({
        analysis,
        result: analysisResult,
      });
    } catch (error) {
      console.error("Error creating analysis:", error);
      res.status(500).json({ message: "Failed to analyze product" });
    }
  });

  app.get('/api/analysis/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await storage.getUserAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // OCR and ingredient extraction
  app.post('/api/extract-ingredients', isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const ingredients = await extractIngredientsFromText(text);
      res.json({ ingredients });
    } catch (error) {
      console.error("Error extracting ingredients:", error);
      res.status(500).json({ message: "Failed to extract ingredients" });
    }
  });

  // Recommendations
  app.get('/api/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.skinType) {
        return res.status(400).json({ message: "Please complete your skin profile first" });
      }

      const products = await storage.getUserProducts(userId);
      const skinProfile = {
        skinType: user.skinType,
        skinConcerns: (user.skinConcerns as string[]) || [],
        allergies: (user.allergies as string[]) || [],
        preferences: (user.preferences as string[]) || [],
      };

      const recommendations = await generateProductRecommendations(skinProfile, products);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Stats endpoint
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getUserProducts(userId);
      const analyses = await storage.getUserAnalyses(userId);
      
      const compatibleProducts = products.filter(p => 
        p.compatibilityRating === 'excellent' || p.compatibilityRating === 'good'
      );
      
      const compatibilityPercentage = products.length > 0 
        ? Math.round((compatibleProducts.length / products.length) * 100)
        : 0;
      
      // Rough calculation of money saved based on avoided bad products
      const savedMoney = products.filter(p => 
        p.compatibilityRating === 'avoid' || p.compatibilityRating === 'caution'
      ).length * 25; // Assume $25 average product price

      res.json({
        analyzedProducts: products.length,
        compatibility: compatibilityPercentage,
        savedMoney,
        totalAnalyses: analyses.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
