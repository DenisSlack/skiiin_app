import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeIngredientsWithPerplexity, findProductIngredients, generatePartnerRecommendations, extractIngredientsFromText, findProductImage, getPersonalizedRecommendation } from "./perplexity";
import { scoreProduct } from "./scoring";
import { insertProductSchema, insertAnalysisSchema, updateSkinProfileSchema, loginSchema, registerSchema, smsLoginSchema, smsVerifySchema } from "@shared/schema";
import { sendSMSCode, generateSMSCode } from "./smsService";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { z } from "zod";

// Unified authentication middleware
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    // First check Replit authentication
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        req.user = user;
        return next();
      }
    }
    
    // Then check session-based authentication
    if (req.session?.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Simple login/password authentication routes
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

      // Check password (in production, use proper password hashing)
      if (user.password !== password) {
        return res.status(400).json({ message: "Неверный логин или пароль" });
      }

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;

      res.json({ user, message: "Вход выполнен успешно" });
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

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка выхода" });
      }
      res.json({ message: "Выход выполнен успешно" });
    });
  });

  // Test SMS Aero connection
  app.get('/api/auth/sms/test', async (req, res) => {
    try {
      if (!process.env.SMSAERO_API_KEY || !process.env.SMSAERO_EMAIL) {
        return res.status(500).json({ 
          message: "SMS Aero API credentials not configured",
          hasApiKey: !!process.env.SMSAERO_API_KEY,
          hasEmail: !!process.env.SMSAERO_EMAIL
        });
      }

      const credentials = Buffer.from(`${process.env.SMSAERO_EMAIL}:${process.env.SMSAERO_API_KEY}`).toString('base64');
      
      // Test with balance check endpoint
      const response = await fetch('https://gate.smsaero.ru/v2/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      res.json({
        status: response.status,
        success: response.ok,
        data: result,
        credentials: `${process.env.SMSAERO_EMAIL}:***`
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error testing SMS Aero connection",
        error: error.message 
      });
    }
  });

  // SMS Authentication routes
  app.post('/api/auth/sms/send', async (req, res) => {
    try {
      const result = smsLoginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Некорректные данные", 
          errors: result.error.issues 
        });
      }

      const { phone } = result.data;
      const code = generateSMSCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

      // Cleanup old codes
      await storage.cleanupExpiredSmsCodes();

      // Save SMS code to database
      await storage.createSmsCode({
        phone,
        code,
        expiresAt,
        verified: false
      });

      // Try to send SMS, but continue even if it fails for demo purposes
      const smsSent = await sendSMSCode({ phone, code });
      
      if (!smsSent) {
        // For demo purposes, log the code so it can be used for testing
        console.log(`SMS код для демонстрации (телефон ${phone}): ${code}`);
        
        return res.json({ 
          message: "SMS сервис временно недоступен. Для демонстрации используйте код: " + code,
          phone,
          demoCode: code // Only for testing
        });
      }

      res.json({ 
        message: "SMS с кодом отправлен", 
        phone 
      });
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ message: "Ошибка отправки SMS" });
    }
  });

  app.post('/api/auth/sms/verify', async (req, res) => {
    try {
      const result = smsVerifySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Некорректные данные", 
          errors: result.error.issues 
        });
      }

      const { phone, code } = result.data;

      // Verify SMS code
      const smsCode = await storage.getValidSmsCode(phone, code);
      if (!smsCode) {
        return res.status(400).json({ 
          message: "Неверный или истекший код" 
        });
      }

      // Mark code as verified
      await storage.markSmsCodeAsVerified(smsCode.id);

      // Find or create user
      let user = await storage.getUserByPhone(phone);
      if (!user) {
        user = await storage.createUserWithPhone(phone);
      }

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;

      res.json({ 
        user, 
        message: "Вход выполнен успешно" 
      });
    } catch (error) {
      console.error("Error verifying SMS:", error);
      res.status(500).json({ message: "Ошибка верификации SMS" });
    }
  });

  // Unified auth endpoint - handles both Replit auth and session auth
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // First check if user is authenticated via Replit
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          return res.json(user);
        }
      }
      
      // Then check session-based auth
      if (req.session?.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          return res.json(user);
        }
      }
      
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Skin profile routes
  app.put('/api/profile/skin', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = updateSkinProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateSkinProfile(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating skin profile:", error);
      res.status(400).json({ message: "Failed to update skin profile" });
    }
  });

  // Product routes
  app.post('/api/products', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Поиск изображения продукта
      let imageUrl = "";
      try {
        imageUrl = await findProductImage(req.body.name || "");
      } catch (imageError) {
        console.log("Could not find product image:", imageError);
      }
      
      const productData = insertProductSchema.parse({
        ...req.body,
        userId,
        imageUrl: imageUrl || null,
      });

      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/products', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const products = await storage.getUserProducts(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', requireAuth, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if user owns this product
      if (product.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.delete('/api/products/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.id);
      
      await storage.deleteProduct(productId, userId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Analysis routes
  app.post('/api/analysis', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
        // Try enhanced analysis with Perplexity first
        analysisResult = await analyzeIngredientsWithPerplexity(ingredientList, product.name, skinProfile);
        
        // Используем только результаты от Perplexity для обеспечения русскоязычного вывода
        // Дополнительное исследование отключено для сохранения языка интерфейса
      } catch (geminiError) {
        console.error("Gemini analysis failed:", geminiError);
        throw new Error("Failed to analyze ingredients with AI service");
      }

      // Генерируем оценку продукта
      try {
        const ingredientNames = analysisResult.ingredients.map((ing: any) => 
          typeof ing === 'string' ? ing : ing.name
        );
        const productScoring = scoreProduct(
          ingredientNames,
          product.name,
          skinProfile
        );
        analysisResult.scoring = productScoring;
      } catch (scoringError) {
        console.log("Could not generate product scoring:", scoringError);
        analysisResult.scoring = undefined;
      }

      // Генерируем партнерские рекомендации для монетизации
      try {
        const partnerRecommendations = await generatePartnerRecommendations(product.name, skinProfile);
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

  app.get('/api/analysis/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analyses = await storage.getUserAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Personal recommendation based on skin profile
  app.post("/api/analysis/personal-recommendation", requireAuth, async (req: any, res) => {
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
  app.post("/api/analysis/user-reviews", requireAuth, async (req: any, res) => {
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
        const lines = text.split('\n').filter((line: string) => line.trim().length > 10);
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
  app.post('/api/find-ingredients', requireAuth, async (req: any, res) => {
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
  app.post('/api/products/find-ingredients', requireAuth, async (req: any, res) => {
    try {
      const { productName } = req.body;
      
      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      const ingredients = await findProductIngredients(productName);
      
      // Если состав не найден или неполный, предлагаем пользователю сканирование
      if (!ingredients || ingredients.length === 0) {
        return res.json({ 
          ingredients: "",
          message: "Не удалось найти состав продукта в базе данных. Попробуйте отсканировать ингредиенты с упаковки с помощью камеры.",
          suggestScanning: true
        });
      }
      
      // Проверяем качество найденного состава
      const ingredientCount = ingredients.split(',').length;
      if (ingredientCount < 5 || ingredients.length < 30) {
        return res.json({ 
          ingredients: "",
          message: `Найден неполный состав продукта (${ingredientCount} ингредиентов). Для точного анализа рекомендуем отсканировать полный список с упаковки.`,
          suggestScanning: true,
          partialIngredients: ingredients
        });
      }
      
      res.json({ ingredients });
    } catch (error) {
      console.error("Error finding ingredients:", error);
      res.status(500).json({ message: "Failed to find ingredients" });
    }
  });

  // Complete product image analysis endpoint
  app.post("/api/analyze-product-image", requireAuth, async (req, res) => {
    try {
      console.log("Starting product image analysis...");
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Analyze this cosmetic product image and extract:
        1. Product name (if visible)
        2. Complete ingredients list (INCI names)
        
        Return JSON format:
        {
          "productName": "exact product name from package",
          "ingredients": "comma-separated list of ingredients exactly as written"
        }
        
        If ingredients are not clearly visible, return "NO_INGREDIENTS_FOUND" for ingredients.
        Focus on the ingredient list section of the package.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg"
          }
        }
      ]);

      const responseText = result.response.text();
      console.log("Gemini analysis result:", responseText);
      
      try {
        const parsed = JSON.parse(responseText);
        res.json({
          productName: parsed.productName || "Косметический продукт",
          ingredients: parsed.ingredients || "NO_INGREDIENTS_FOUND"
        });
      } catch (parseError) {
        // If JSON parsing fails, try to extract ingredients from raw text
        const lines = responseText.split('\n').filter((line: string) => line.trim());
        const ingredientsLine = lines.find((line: string) => 
          line.toLowerCase().includes('ingredient') || 
          line.includes('aqua') || 
          line.includes('glycerin')
        );
        
        res.json({
          productName: "Косметический продукт",
          ingredients: ingredientsLine || "NO_INGREDIENTS_FOUND"
        });
      }
    } catch (error) {
      console.error("Product image analysis error:", error);
      res.status(500).json({ message: "Failed to analyze product image" });
    }
  });

  // Gemini Vision OCR text extraction endpoint
  app.post("/api/extract-text", requireAuth, async (req, res) => {
    try {
      console.log("Starting Gemini Vision OCR extraction...");
      const { imageData } = req.body;
      
      if (!imageData) {
        console.log("No image data provided");
        return res.status(400).json({ message: "Image data is required" });
      }

      console.log("Image data length:", imageData.length);
      
      // Extract text using Gemini Vision API
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      console.log("Base64 image length after cleanup:", base64Image.length);
      
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Extract ONLY the ingredients list from this cosmetic product image.
        Look for ingredient names like: Aqua, Glycerin, Niacinamide, Cetearyl Alcohol, etc.
        Return the ingredients exactly as written on the package, comma-separated.
        If no clear ingredients are visible, return "NO_INGREDIENTS_FOUND".
        Focus on INCI names (usually in English).
      `;

      console.log("Sending request to Gemini Vision API...");
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg"
          }
        }
      ]);

      const extractedText = result.response.text();
      console.log("Gemini Vision OCR result:", extractedText);
      
      res.json({ text: extractedText });
    } catch (error) {
      console.error("Gemini Vision OCR error:", error);
      res.status(500).json({ message: "Failed to extract text from image" });
    }
  });

  // OCR and ingredient extraction
  app.post('/api/extract-ingredients', requireAuth, async (req: any, res) => {
    try {
      console.log("Starting ingredient extraction...");
      const { text } = req.body;
      
      if (!text) {
        console.log("No text provided");
        return res.status(400).json({ message: "Text is required" });
      }

      console.log("Text length:", text.length);
      console.log("Text preview:", text.substring(0, 200));
      
      console.log("Calling extractIngredientsFromText...");
      const ingredients = await extractIngredientsFromText(text);
      console.log("Extraction completed, ingredients count:", ingredients?.length || 0);
      
      res.json({ ingredients });
    } catch (error: unknown) {
      console.error("Error extracting ingredients:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ message: "Failed to extract ingredients" });
    }
  });

  // Server-side OCR processing
  app.post('/api/ocr-extract', requireAuth, async (req: any, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: "Image is required" });
      }

      console.log("Processing OCR on server...");
      
      // Import Tesseract dynamically to avoid CSP issues
      const Tesseract = await import('tesseract.js');
      
      const { data: { text } } = await Tesseract.recognize(image, 'eng+rus', {
        logger: m => console.log('OCR Progress:', m.progress * 100 + '%')
      });
      
      console.log("Server OCR completed, text length:", text.length);
      res.json({ text: text.trim() });
    } catch (error) {
      console.error("Server OCR error:", error);
      res.status(500).json({ message: "Failed to process OCR" });
    }
  });

  // Extract product name from text
  app.post('/api/extract-product-name', requireAuth, async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      try {
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
                content: "Извлеки название косметического продукта из текста. Верни только название продукта без дополнительной информации. Если название не найдено, верни 'Косметический продукт'."
              },
              {
                role: "user",
                content: `Найди название косметического продукта в этом тексте: ${text}`
              }
            ],
            max_tokens: 50,
            temperature: 0.1,
            top_p: 0.8,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`Perplexity API error: ${response.status}`);
        }

        const data = await response.json();
        let productName = data.choices[0]?.message?.content?.trim() || "Косметический продукт";
        
        // Очищаем результат от лишних символов
        productName = productName.replace(/['"]/g, '').trim();
        
        // Если результат слишком длинный или содержит системную информацию, используем заглушку
        if (productName.length > 100 || productName.toLowerCase().includes('не найден') || productName.toLowerCase().includes('text')) {
          productName = "Косметический продукт";
        }

        res.json({ productName });
      } catch (error) {
        console.error("Error extracting product name:", error);
        res.json({ productName: "Косметический продукт" });
      }
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Failed to extract product name" });
    }
  });

  // Recommendations
  app.get('/api/recommendations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      
      // Return basic recommendations for now
      recommendations = {
        recommendations: [],
        reasoning: "Рекомендации временно недоступны",
        marketInsights: []
      };

      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Enhanced ingredient research endpoint
  app.post('/api/ingredient-research', requireAuth, async (req: any, res) => {
    try {
      const { ingredientName, skinType } = req.body;
      
      if (!ingredientName) {
        return res.status(400).json({ message: "Ingredient name is required" });
      }

      // Research functionality temporarily disabled
      res.json({
        safetyProfile: "Исследование безопасности временно недоступно",
        recentStudies: [],
        expertOpinions: []
      });
    } catch (error) {
      console.error("Error researching ingredient:", error);
      res.status(500).json({ message: "Failed to research ingredient" });
    }
  });

  // Stats endpoint
  app.get('/api/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Admin authentication middleware
  const adminAuth = (req: any, res: any, next: any) => {
    const { adminSession } = req.session || {};
    if (!adminSession?.isAuthenticated) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  };

  // Admin login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple admin credentials (in production, use secure authentication)
      const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
      
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        (req.session as any).adminSession = { isAuthenticated: true, username };
        res.json({ success: true, message: "Admin login successful" });
      } else {
        res.status(401).json({ message: "Invalid admin credentials" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin logout
  app.post('/api/admin/logout', (req: any, res) => {
    req.session.adminSession = null;
    res.json({ success: true });
  });

  // Admin stats
  app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      const { data: analyses, error: analysesError } = await supabase
        .from('analyses')
        .select('*');

      if (usersError) console.error("Users error:", usersError);
      if (productsError) console.error("Products error:", productsError);
      if (analysesError) console.error("Analyses error:", analysesError);

      res.json({
        userCount: users?.length || 0,
        productCount: products?.length || 0,
        analysisCount: analyses?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get table list
  app.get('/api/admin/tables', adminAuth, (req, res) => {
    res.json(['users', 'products', 'analyses', 'ingredients', 'sms_codes']);
  });

  // Get table data with search
  app.get('/api/admin/table/:tableName', adminAuth, async (req, res) => {
    try {
      const { tableName } = req.params;
      const { search } = req.query;

      console.log(`=== Admin Table Request ===`);
      console.log(`Table: ${tableName}`);
      console.log(`Search: ${search}`);
      console.log(`Full URL: ${req.originalUrl}`);

      let query = supabase.from(tableName).select('*').limit(100);

      // Add search functionality for text fields
      if (search && typeof search === 'string' && search.trim() !== '') {
        console.log(`Adding search filter for: ${search}`);
        if (tableName === 'users') {
          query = query.or(`username.ilike.%${search}%, email.ilike.%${search}%`);
        } else if (tableName === 'products') {
          query = query.or(`name.ilike.%${search}%, brand.ilike.%${search}%`);
        }
      }

      console.log(`Executing Supabase query for ${tableName}...`);
      const { data, error } = await query;

      if (error) {
        console.error(`Supabase error for ${tableName}:`, error);
        return res.status(500).json({ message: `Database error: ${error.message}` });
      }

      console.log(`Successfully fetched ${data?.length || 0} records from ${tableName}`);
      if (data && data.length > 0) {
        console.log(`Sample record:`, JSON.stringify(data[0], null, 2));
      } else {
        console.log(`No records found in ${tableName} table`);
      }
      
      res.json(data || []);
    } catch (error) {
      console.error(`Error fetching ${req.params.tableName} data:`, error);
      res.status(500).json({ message: "Failed to fetch table data" });
    }
  });

  // Delete record from table
  app.delete('/api/admin/:tableName/:id', adminAuth, async (req, res) => {
    try {
      const { tableName, id } = req.params;

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting record from ${req.params.tableName}:`, error);
      res.status(500).json({ message: "Failed to delete record" });
    }
  });

  // Update record in table
  app.put('/api/admin/:tableName/:id', adminAuth, async (req, res) => {
    try {
      const { tableName, id } = req.params;
      const updateData = req.body;

      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json(data);
    } catch (error) {
      console.error(`Error updating record in ${req.params.tableName}:`, error);
      res.status(500).json({ message: "Failed to update record" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
