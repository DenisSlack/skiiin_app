import { GoogleGenerativeAI } from "@google/generative-ai";
import { Perplexity } from './perplexityApi';

const perplexity = new Perplexity(process.env.PERPLEXITY_API_KEY || '');

// Интерфейсы
export interface SkinProfile {
  skinType: string;
  skinConcerns: string[];
  allergies: string[];
  preferences: string[];
}

export interface IngredientAnalysis {
  name: string;
  purpose?: string;
  benefits?: string[];
  concerns?: string[];
  safetyRating: 'safe' | 'caution' | 'avoid';
  scientificResearch?: string;
  expertOpinion?: string;
}

export interface ProductScore {
  overall: number;
  safety: number;
  effectiveness: number;
  suitability: number;
  innovation: number;
  valueForMoney: number;
  breakdown: {
    ingredientQuality: number;
    formulationBalance: number;
    skinTypeMatch: number;
    allergyRisk: number;
    scientificEvidence: number;
  };
  recommendation: 'excellent' | 'good' | 'caution' | 'avoid';
  confidenceLevel: number;
}

export interface EnhancedProductAnalysisResult {
  compatibilityScore: number;
  compatibilityRating: 'excellent' | 'good' | 'caution' | 'avoid';
  ingredients: IngredientAnalysis[];
  insights: {
    positive: string[];
    concerns: string[];
    recommendations: string[];
    marketTrends?: string[];
    expertAdvice?: string[];
  };
  overallAssessment: string;
  researchSummary?: string;
  alternativeProducts?: string[];
  scoring?: ProductScore;
}

// Поиск ингредиентов продукта
export async function findProductIngredients(productName: string): Promise<string[]> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY не настроен");
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
            content: "You are a cosmetics ingredients database. When asked about a product, return ONLY the ingredients list in INCI names, separated by commas."
          },
          {
            role: "user",
            content: `What are the ingredients in "${productName}"?`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const ingredients = data.choices[0]?.message?.content?.trim() || "";
    
    if (!ingredients || ingredients === "NO_INGREDIENTS_FOUND") {
      return [];
    }

    return ingredients
      .split(',')
      .map((i: string): string => i.trim())
      .filter((i: string): boolean => Boolean(i && i.length > 1));
  } catch (error) {
    console.error("Error finding ingredients:", error);
    return [];
  }
}

// Анализ ингредиентов через Perplexity
export async function analyzeIngredientsWithPerplexity(ingredientList: string): Promise<EnhancedProductAnalysisResult> {
  // Заглушка для демонстрации
  return {
    compatibilityScore: 85,
    compatibilityRating: 'good',
    ingredients: ingredientList.split(',').map(name => ({
      name: name.trim(),
      safetyRating: 'safe',
      purpose: 'Moisturizing and nourishing',
    })),
    insights: {
      positive: ['Natural ingredients', 'Good moisturizing properties'],
      concerns: [],
      recommendations: ['Suitable for daily use'],
      marketTrends: ['Growing popularity of natural ingredients'],
      expertAdvice: ['Recommended by dermatologists']
    },
    overallAssessment: 'This product appears to be safe and effective for most skin types.',
    scoring: {
      overall: 85,
      safety: 90,
      effectiveness: 85,
      suitability: 80,
      innovation: 75,
      valueForMoney: 85,
      breakdown: {
        ingredientQuality: 90,
        formulationBalance: 85,
        skinTypeMatch: 80,
        allergyRisk: 90,
        scientificEvidence: 85
      },
      recommendation: 'good',
      confidenceLevel: 85
    }
  };
}

// Извлечение ингредиентов из текста
export async function extractIngredientsFromText(inputText: string): Promise<string[]> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY не настроен");
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
            content: "Извлеки только названия косметических ингредиентов из текста. Верни их списком через запятую на английском языке."
          },
          {
            role: "user",
            content: `Извлеки ингредиенты из этого текста: ${inputText}`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const ingredients = data.choices[0]?.message?.content?.trim() || "";
    
    return ingredients.split(',').map(ingredient => ingredient.trim()).filter(Boolean);
  } catch (error) {
    console.error("Error extracting ingredients:", error);
    return [];
  }
}

// Поиск изображения продукта
export async function findProductImage(productName: string): Promise<string | null> {
  // Заглушка для демонстрации
  return null;
}

// Генерация партнерских рекомендаций
export async function generatePartnerRecommendations(productData: any): Promise<any> {
  // Заглушка для демонстрации
  return {
    products: [],
    reasoning: "No partner recommendations available at this time."
  };
}

// Персонализированные рекомендации
export async function getPersonalizedRecommendation(
  productName: string,
  ingredients: string,
  skinProfile: any
): Promise<string> {
  // Заглушка для демонстрации
  return `Based on your ${skinProfile.skinType} skin type and concerns about ${skinProfile.skinConcerns.join(', ')}, this product appears to be suitable for your needs. The ingredients are generally safe and effective for your skin profile.`;
}