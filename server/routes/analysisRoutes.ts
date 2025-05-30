import { Router } from 'express';
import { scoreProduct } from '../scoring';
import { insertAnalysisSchema } from '@shared/schema';
import { container } from '../di/container';

const router = Router();
const { analysisService } = container;

// Создание анализа продукта
router.post('/api/analysis', async (req: any, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userId = req.session.userId;
    const { productId, ingredientList } = req.body;
    if (!productId || !ingredientList) {
      return res.status(400).json({ message: 'Missing required fields: productId and ingredientList' });
    }
    const parsedProductId = parseInt(productId);
    if (isNaN(parsedProductId)) {
      return res.status(400).json({ message: 'Invalid productId format' });
    }
    // Получаем профиль пользователя и продукт (можно вынести в userService/productService)
    // Здесь оставим как есть для краткости
    const user = await container.userService.getUserById(userId);
    const skinProfile = user?.skinType ? {
      skinType: user.skinType,
      skinConcerns: (user.skinConcerns as string[]) || [],
      allergies: (user.allergies as string[]) || [],
      preferences: (user.preferences as string[]) || [],
    } : undefined;
    const product = await container.productService.getProductById(productId);
    if (!product || product.userId !== userId) {
      return res.status(404).json({ message: 'Product not found' });
    }
    let analysisResult: any = {};
    try {
      analysisResult = await analysisService.analyzeIngredients(ingredientList, product.name, skinProfile);
    } catch (perplexityError) {
      analysisResult = { error: 'AI analysis failed' };
    }
    if (analysisResult && analysisResult.ingredients) {
      try {
        const ingredientNames = analysisResult.ingredients.map((ing: any) => typeof ing === 'string' ? ing : ing.name) || [];
        const productScoring = scoreProduct(ingredientNames, product.name, skinProfile);
        analysisResult.scoring = productScoring;
      } catch (scoringError) {
        analysisResult.scoring = undefined;
      }
      // Партнерские рекомендации можно оставить как есть или вынести в отдельный сервис
    }
    const analysisData = insertAnalysisSchema.parse({
      productId,
      userId,
      insights: analysisResult.insights,
      recommendations: analysisResult.insights?.recommendations,
      ingredientBreakdown: analysisResult.ingredients,
      scoring: analysisResult.scoring,
    });
    const analysis = await analysisService.createAnalysis(analysisData);
    res.json({ analysis, result: analysisResult });
  } catch (error) {
    res.status(500).json({ message: 'Failed to analyze product' });
  }
});

// Получение анализов пользователя
router.get('/api/analysis/user', async (req: any, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userId = req.session.userId;
    const analyses = await analysisService.getUserAnalyses(userId);
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analyses' });
  }
});

export default router; 