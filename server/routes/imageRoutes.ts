import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractIngredientsFromText } from '../perplexity';
import { limitImageSize } from '../middleware/limitImageSize';

const router = Router();

// Анализ изображения продукта (Gemini Vision)
router.post('/api/analyze-product-image', limitImageSize('imageData'), async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ message: 'Image data is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY не настроен');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze this cosmetic product image and extract:\n1. Product name (if visible)\n2. Complete ingredients list (INCI names)\nReturn JSON format: {\n  "productName": "exact product name from package",\n  "ingredients": "comma-separated list of ingredients exactly as written"\n}\nIf ingredients are not clearly visible, return "NO_INGREDIENTS_FOUND" for ingredients.`;
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
          mimeType: 'image/jpeg'
        }
      }
    ]);
    const responseText = result.response.text();
    try {
      const parsed = JSON.parse(responseText);
      res.json({
        productName: parsed.productName || 'Косметический продукт',
        ingredients: parsed.ingredients || 'NO_INGREDIENTS_FOUND'
      });
    } catch (parseError) {
      res.json({
        productName: 'Косметический продукт',
        ingredients: 'NO_INGREDIENTS_FOUND'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to analyze product image' });
  }
});

// OCR и извлечение текста
router.post('/api/extract-text', limitImageSize('imageData'), async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ message: 'Image data is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY не настроен');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Extract ONLY the ingredients list from this cosmetic product image. Look for ingredient names like: Aqua, Glycerin, Niacinamide, Cetearyl Alcohol, etc. Return the ingredients exactly as written on the package, comma-separated. If no clear ingredients are visible, return "NO_INGREDIENTS_FOUND".`;
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
          mimeType: 'image/jpeg'
        }
      }
    ]);
    const extractedText = result.response.text();
    res.json({ text: extractedText });
  } catch (error) {
    res.status(500).json({ message: 'Failed to extract text from image' });
  }
});

// Извлечение ингредиентов из текста
router.post('/api/extract-ingredients', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    const ingredients = await extractIngredientsFromText(text);
    res.json({ ingredients });
  } catch (error) {
    res.status(500).json({ message: 'Failed to extract ingredients' });
  }
});

export default router; 