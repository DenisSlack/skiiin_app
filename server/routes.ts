import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeIngredientsWithGemini, getProductRecommendationsWithGemini, researchIngredientSafety, findProductIngredients, generatePartnerRecommendations, extractIngredientsFromText } from "./gemini";
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

      // Get product details
      const product = await storage.getProduct(productId);
      if (!product || product.userId !== userId) {
        return res.status(404).json({ message: "Product not found" });
      }

      let analysisResult;
      
      try {
        // Try enhanced analysis with Gemini first
        analysisResult = await analyzeIngredientsWithGemini(ingredientList, product.name, skinProfile);
        
        // Add additional research for key ingredients
        const topIngredients = analysisResult.ingredients.slice(0, 3);
        for (const ingredient of topIngredients) {
          try {
            const safetyResearch = await researchIngredientSafety(ingredient.name, skinProfile?.skinType);
            ingredient.scientificResearch = safetyResearch.safetyProfile;
            ingredient.expertOpinion = safetyResearch.expertOpinions.join(' ');
          } catch (researchError) {
            console.log(`Could not get additional research for ${ingredient.name}`);
          }
        }
      } catch (geminiError) {
        console.error("Gemini analysis failed:", geminiError);
        throw new Error("Failed to analyze ingredients with AI service");
      }

      // Генерируем партнерские рекомендации для монетизации
      try {
        const partnerRecommendations = await generatePartnerRecommendations(analysisResult, skinProfile);
        analysisResult.partnerRecommendations = partnerRecommendations;
      } catch (partnerError) {
        console.log("Could not generate partner recommendations:", partnerError);
        analysisResult.partnerRecommendations = { products: [], reasoning: "" };
      }

      // Обновляем продукт с результатами анализа (не создаем новый)
      // Продукт уже существует, просто сохраняем анализ

      // Save analysis
      const analysisData = insertAnalysisSchema.parse({
        productId,
        userId,
        insights: analysisResult.insights,
        recommendations: analysisResult.insights.recommendations,
        ingredientBreakdown: analysisResult.ingredients,
        scoring: analysisResult.scoring,
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

  // Personal recommendation based on skin profile
  app.post("/api/analysis/personal-recommendation", isAuthenticated, async (req: any, res) => {
    try {
      const { productName, ingredients, skinProfile } = req.body;
      
      if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(500).json({ message: "PERPLEXITY_API_KEY не настроен" });
      }

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "Ты опытный дерматолог и косметолог. Давай персональные советы по продуктам."
            },
            {
              role: "user",
              content: `Продукт: ${productName}
Состав: ${ingredients}
Профиль кожи: тип - ${skinProfile.skinType}, проблемы - ${skinProfile.skinConcerns?.join(', ')}, аллергии - ${skinProfile.allergies?.join(', ')}, предпочтения - ${skinProfile.preferences?.join(', ')}

На сколько данное средство, исходя из состава подойдет моему типу кожи с учетом наличия аллергических реакций и состояния кожи? Дай ответ до 300 символов на русском языке.`
            }
          ],
          max_tokens: 400,
          temperature: 0.3,
          top_p: 0.9,
          search_recency_filter: "month",
          return_images: false,
          return_related_questions: false,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const recommendation = data.choices[0]?.message?.content?.trim() || "";
      
      res.json({ recommendation });
    } catch (error) {
      console.error("Error generating personal recommendation:", error);
      res.status(500).json({ 
        message: "Failed to generate personal recommendation", 
        error: (error as Error).message 
      });
    }
  });

  // User reviews from internet
  app.post("/api/analysis/user-reviews", isAuthenticated, async (req: any, res) => {
    try {
      const { productName } = req.body;
      
      if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(500).json({ message: "PERPLEXITY_API_KEY не настроен" });
      }

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "Ты эксперт по анализу отзывов в интернете. Собирай реальные отзывы пользователей о косметических продуктах."
            },
            {
              role: "user",
              content: `Найди и собери отзывы пользователей о продукте "${productName}" из интернета. Ищи на сайтах отзывов, форумах, социальных сетях. Представь 3-5 кратких реальных отзыва пользователей на русском языке. Каждый отзыв должен быть до 150 символов.

Ответь в JSON формате:
{
  "reviews": ["отзыв 1", "отзыв 2", "отзыв 3", "отзыв 4", "отзыв 5"]
}`
            }
          ],
          max_tokens: 800,
          temperature: 0.3,
          top_p: 0.9,
          search_recency_filter: "month",
          return_images: false,
          return_related_questions: false,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content?.trim() || "";
      
      let reviews: string[] = [];
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          reviews = parsed.reviews || [];
        }
      } catch (parseError) {
        console.error("Failed to parse reviews JSON:", parseError);
        // Fallback: extract reviews from text
        const lines = text.split('\n').filter(line => line.trim().length > 10);
        reviews = lines.slice(0, 5);
      }
      
      res.json({ reviews });
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ 
        message: "Failed to fetch user reviews", 
        error: (error as Error).message 
      });
    }
  });

  // Поиск ингредиентов по названию продукта
  app.post('/api/find-ingredients', isAuthenticated, async (req: any, res) => {
    try {
      const { productName } = req.body;
      
      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      const ingredients = await findProductIngredients(productName);
      res.json({ ingredients });
    } catch (error) {
      console.error("Error finding ingredients:", error);
      res.status(500).json({ message: "Failed to find ingredients" });
    }
  });

  // Alternative endpoint path for product ingredient search
  app.post('/api/products/find-ingredients', isAuthenticated, async (req: any, res) => {
    try {
      const { productName } = req.body;
      
      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      const ingredients = await findProductIngredients(productName);
      res.json({ ingredients });
    } catch (error) {
      console.error("Error finding ingredients:", error);
      res.status(500).json({ message: "Failed to find ingredients" });
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

      let recommendations;
      
      try {
        // Try enhanced recommendations with Gemini first
        recommendations = await getProductRecommendationsWithGemini(skinProfile, products);
      } catch (geminiError) {
        console.error("Failed to generate recommendations:", geminiError);
        recommendations = {
          recommendations: [],
          reasoning: "Рекомендации временно недоступны",
          marketInsights: []
        };
      }

      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Enhanced ingredient research endpoint
  app.post('/api/ingredient-research', isAuthenticated, async (req: any, res) => {
    try {
      const { ingredientName, skinType } = req.body;
      
      if (!ingredientName) {
        return res.status(400).json({ message: "Ingredient name is required" });
      }

      const research = await researchIngredientSafety(ingredientName, skinType);
      res.json(research);
    } catch (error) {
      console.error("Error researching ingredient:", error);
      res.status(500).json({ message: "Failed to research ingredient" });
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
