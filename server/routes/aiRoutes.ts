import { Router } from 'express';
import { findProductIngredients, getPersonalizedRecommendation } from '../perplexity';

const router = Router();

// Поиск ингредиентов по названию продукта
router.post('/api/products/find-ingredients', async (req, res) => {
  try {
    const { productName } = req.body;
    if (!productName) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    const ingredients = await findProductIngredients(productName);
    if (!ingredients || ingredients.length === 0) {
      return res.json({ 
        ingredients: '',
        message: 'Не удалось найти состав продукта в базе данных. Попробуйте отсканировать ингредиенты с упаковки с помощью камеры.',
        suggestScanning: true
      });
    }
    const ingredientCount = ingredients.split(',').length;
    // Убираем слишком строгую валидацию - если найдены ингредиенты, возвращаем их
    if (ingredientCount < 2) {
      return res.json({ 
        ingredients: '',
        message: `Найден неполный состав продукта (${ingredientCount} ингредиентов). Для точного анализа рекомендуем отсканировать полный список с упаковки.`,
        suggestScanning: true,
        partialIngredients: ingredients
      });
    }
    res.json({ ingredients });
  } catch (error) {
    res.status(500).json({ message: 'Failed to find ingredients' });
  }
});

// Персональная рекомендация
router.post('/api/analysis/personal-recommendation', async (req, res) => {
  try {
    const { productName, ingredients, skinProfile } = req.body;
    const recommendation = await getPersonalizedRecommendation(productName, ingredients, skinProfile);
    res.json({ recommendation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate personal recommendation' });
  }
});

// Извлечение названия продукта из текста
router.post('/api/extract-product-name', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    // Здесь должен быть вызов AI для извлечения названия (упрощённо)
    res.json({ productName: 'Косметический продукт' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to extract product name' });
  }
});

export default router; 