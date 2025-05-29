import { GoogleGenerativeAI } from "@google/generative-ai";
import { scoreProduct, scoreIngredient, ProductScore } from "./scoring";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface EnhancedIngredientAnalysis {
  name: string;
  purpose: string;
  benefits: string[];
  concerns: string[];
  safetyRating: "safe" | "caution" | "avoid";
  compatibilityScore: number; // 0-100
  scientificResearch?: string;
  expertOpinion?: string;
}

export interface EnhancedProductAnalysisResult {
  compatibilityScore: number;
  compatibilityRating: "excellent" | "good" | "caution" | "avoid";
  ingredients: EnhancedIngredientAnalysis[];
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
  partnerRecommendations?: {
    products: any[];
    reasoning: string;
  };
  scoring?: ProductScore;
}

export interface SkinProfile {
  skinType: string;
  skinConcerns: string[];
  allergies: string[];
  preferences: string[];
}

export async function analyzeIngredientsWithGemini(
  ingredientList: string,
  productName: string,
  skinProfile?: SkinProfile
): Promise<EnhancedProductAnalysisResult> {
  try {
    // Используем Perplexity для получения актуальных данных о каждом ингредиенте
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY не настроен");
    }

    // Ограничиваем количество ингредиентов для ускорения анализа
    const ingredients = ingredientList.split(',').slice(0, 5).map(i => i.trim());
    
    const skinProfileText = skinProfile ? `
Профиль кожи пользователя:
- Тип кожи: ${skinProfile.skinType}
- Проблемы: ${skinProfile.skinConcerns.join(', ')}
- Аллергии: ${skinProfile.allergies.join(', ')}
- Предпочтения: ${skinProfile.preferences.join(', ')}` : '';

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
            content: "Ты ведущий эксперт косметолог и дерматолог с доступом к последним научным исследованиям. Анализируй ингредиенты косметики на основе актуальных данных из научных источников и исследований. ВАЖНО: Все ответы должны быть ТОЛЬКО на русском языке, включая все описания, рекомендации и выводы."
          },
          {
            role: "user",
            content: `Проанализируй продукт "${productName}" с составом: ${ingredients.join(', ')}

${skinProfileText}

Для первых 5 ключевых ингредиентов дай краткий анализ:
1. Назначение
2. Безопасность для типа кожи пользователя
3. Совместимость (0-100)

Общая оценка продукта и рекомендации.

ОБЯЗАТЕЛЬНО: Все тексты, описания, рекомендации и выводы должны быть написаны НА РУССКОМ ЯЗЫКЕ.

Ответь строго в JSON формате:
{
  "compatibilityScore": число_0_100,
  "compatibilityRating": "excellent"|"good"|"caution"|"avoid",
  "ingredients": [
    {
      "name": "название",
      "purpose": "назначение",
      "benefits": ["преимущество1", "преимущество2"],
      "concerns": ["проблема1", "проблема2"],
      "safetyRating": "safe"|"caution"|"avoid",
      "compatibilityScore": число_0_100,
      "scientificResearch": "последние исследования",
      "expertOpinion": "мнение экспертов"
    }
  ],
  "insights": {
    "positive": ["положительные стороны"],
    "concerns": ["предупреждения"],
    "recommendations": ["рекомендации"],
    "marketTrends": ["рыночные тренды"],
    "expertAdvice": ["советы экспертов"]
  },
  "overallAssessment": "общая оценка",
  "researchSummary": "резюме исследований",
  "alternativeProducts": ["альтернативы"]
}`
          }
        ],
        max_tokens: 1200,
        temperature: 0.2,
        top_p: 0.8,
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
    let text = data.choices[0]?.message?.content?.trim() || "";
    
    // Очищаем от markdown и комментариев
    text = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/\/\/.*$/gm, '') // убираем однострочные комментарии
      .replace(/\/\*[\s\S]*?\*\//g, '') // убираем многострочные комментарии
      .trim();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Gemini");
    }
    
    let jsonText = jsonMatch[0];
    // Дополнительная очистка внутри JSON
    jsonText = jsonText
      .replace(/\/\/.*$/gm, '') // убираем комментарии
      .replace(/,(\s*[}\]])/g, '$1') // убираем лишние запятые
      .replace(/,\s*,/g, ',') // убираем двойные запятые
      .replace(/:\s*,/g, ': null,') // заменяем пустые значения на null
      .replace(/"\s*\n\s*"/g, '" "') // склеиваем разорванные строки
      .replace(/([^"]),\s*}/g, '$1}') // убираем запятые перед закрывающими скобками
      .replace(/([^"]),\s*]/g, '$1]'); // убираем запятые перед закрывающими квадратными скобками
    
    // Попытка парсинга с обработкой ошибок
    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.log("First JSON parse failed, trying to fix malformed JSON...");
      // Попытка исправить JSON, ограничив размер массивов
      jsonText = jsonText.replace(/"ingredients":\s*\[([^}]*?)\]/, (match, content) => {
        // Ограничиваем количество ингредиентов для более стабильного парсинга
        const ingredients = content.split(',').slice(0, 15); // берем первые 15 ингредиентов
        return `"ingredients": [${ingredients.join(',')}]`;
      });
      
      try {
        analysisResult = JSON.parse(jsonText);
      } catch (secondError) {
        console.error("JSON parsing failed completely:", secondError);
        // Возвращаем базовый результат с скорингом
        const fallbackScore = scoreProduct(
          ingredients,
          productName,
          skinProfile
        );
        
        return {
          compatibilityScore: fallbackScore.overall,
          compatibilityRating: fallbackScore.recommendation === "fair" ? "good" : 
                              fallbackScore.recommendation === "poor" ? "caution" : fallbackScore.recommendation,
          ingredients: [],
          insights: {
            positive: ["Продукт проанализирован"],
            concerns: ["Требуется дополнительный анализ"],
            recommendations: ["Рекомендуется консультация со специалистом"]
          },
          overallAssessment: "Анализ выполнен с ограничениями из-за сложности состава",
          scoring: fallbackScore
        };
      }
    }
    
    // Добавляем скоринговую модель
    const productScore = scoreProduct(
      ingredients,
      productName,
      skinProfile
    );

    // Обогащаем результат скоринговой моделью
    const enhancedResult = {
      ...analysisResult,
      scoring: productScore,
      compatibilityScore: productScore.overall,
      compatibilityRating: productScore.recommendation === "fair" ? "good" : 
                          productScore.recommendation === "poor" ? "caution" : 
                          productScore.recommendation
    } as EnhancedProductAnalysisResult;

    return enhancedResult;
  } catch (error) {
    console.error("Error analyzing ingredients with Gemini:", error);
    throw new Error("Failed to analyze ingredients: " + (error as Error).message);
  }
}

export async function getProductRecommendationsWithGemini(
  skinProfile: SkinProfile,
  analyzedProducts: any[],
  currentTrends?: string[]
): Promise<{ recommendations: string[]; reasoning: string; marketInsights: string[] }> {
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
            content: "Ты ведущий эксперт косметолог и консультант по уходу за кожей с доступом к последним исследованиям и рыночным данным. Предоставляй персональные рекомендации на основе актуальной информации. ВАЖНО: Все ответы должны быть ТОЛЬКО на русском языке."
          },
          {
            role: "user",
            content: `Создай персональные рекомендации продуктов для пользователя:

Профиль кожи: ${JSON.stringify(skinProfile)}
Проанализированные продукты: ${JSON.stringify(analyzedProducts)}
Актуальные тренды: ${currentTrends?.join(', ') || 'Общие тренды ухода за кожей'}

Основывайся на:
1. Последних научных исследованиях в косметологии (2023-2024)
2. Новых прорывных ингредиентах и технологиях
3. Клинических исследованиях эффективности
4. Экспертных рекомендациях дерматологов
5. Актуальных рыночных трендах
6. Совместимости ингредиентов

Ответь в JSON формате:
{
  "recommendations": ["конкретные рекомендации продуктов с научным обоснованием"],
  "reasoning": "детальное объяснение на основе исследований и профиля кожи",
  "marketInsights": ["актуальные рыночные тренды и инновации для этого пользователя"]
}`
          }
        ],
        max_tokens: 1500,
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
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Perplexity");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error generating recommendations with Perplexity:", error);
    throw new Error("Failed to generate recommendations: " + (error as Error).message);
  }
}

// Функция для поиска ингредиентов продукта по названию через Perplexity AI
export async function findProductIngredients(productName: string): Promise<string> {
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
            content: "Ты эксперт по косметике. Возвращай ТОЛЬКО чистый список ингредиентов без объяснений, рассуждений или технической информации."
          },
          {
            role: "user",
            content: `Найди состав продукта "${productName}". 

ВЕРНИ ТОЛЬКО: список ингредиентов через запятую

НЕ ДОБАВЛЯЙ:
- "Из доступных источников..."
- "Однако..."
- "По информации..."
- Любые объяснения или комментарии

Пример правильного ответа: "Water, Glycerin, Niacinamide, Cetyl Alcohol"

Если состав не найден, верни пустую строку.`
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
        top_p: 0.8,
        search_recency_filter: "week",
        return_images: false,
        return_related_questions: false,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    let ingredients = data.choices[0]?.message?.content?.trim() || "";
    
    // Очищаем от технических фраз и объяснений
    const unwantedPhrases = [
      "Из доступных источников",
      "не удалось найти",
      "Однако",
      "По информации",
      "К сожалению",
      "Unfortunately",
      "However",
      "Based on available information",
      "According to",
      "Please note",
      "It should be noted"
    ];
    
    // Удаляем предложения с нежелательными фразами
    const sentences = ingredients.split(/[.!?]\s+/);
    const cleanSentences = sentences.filter(sentence => {
      return !unwantedPhrases.some(phrase => 
        sentence.toLowerCase().includes(phrase.toLowerCase())
      );
    });
    
    ingredients = cleanSentences.join('. ').trim();
    
    // Извлекаем только часть с ингредиентами (обычно после двоеточия или в конце)
    if (ingredients.includes(':')) {
      const parts = ingredients.split(':');
      ingredients = parts[parts.length - 1].trim();
    }
    
    // Проверяем, что получили реальный список ингредиентов
    if (ingredients.includes("не найден") || 
        ingredients.includes("not found") || 
        ingredients.includes("не могу") ||
        ingredients.includes("cannot") ||
        ingredients.length < 10) {
      return "";
    }
    
    return ingredients;
  } catch (error) {
    console.error("Error finding product ingredients via Perplexity:", error);
    return "";
  }
}

// Функция для извлечения ингредиентов из текста
export async function extractIngredientsFromText(inputText: string): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-8b",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 500,
      }
    });

    const prompt = `Извлеки все косметические ингредиенты из данного текста. Верни только чистый список ингредиентов в формате JSON.
    
    Текст: "${inputText}"
    
    Верни в JSON формате:
    {
      "ingredients": ["ингредиент1", "ингредиент2", ...]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();
    
    // Очищаем от markdown и комментариев
    responseText = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
    
    // Ищем JSON объект
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonText = jsonMatch[0];
      jsonText = jsonText.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
      const parsed = JSON.parse(jsonText);
      return parsed.ingredients || [];
    }
    
    return [];
  } catch (error) {
    console.error("Error extracting ingredients:", error);
    // Fallback: простое извлечение из исходного текста
    const cleanText = inputText.replace(/[^\w\s,.-]/g, '').trim();
    return cleanText
      .split(/[,\n]/)
      .map((ingredient: string) => ingredient.trim())
      .filter((ingredient: string) => ingredient.length > 2 && ingredient.length < 50);
  }
}

// Функция для генерации рекомендаций партнерских товаров
export async function generatePartnerRecommendations(
  analysisResult: any,
  skinProfile?: SkinProfile
): Promise<{ products: any[]; reasoning: string }> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-8b",
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 600,
      }
    });

    const prompt = `На основе анализа косметического продукта и профиля кожи, предложи 3-5 альтернативных товаров для покупки.
    
    Анализ продукта: ${JSON.stringify(analysisResult)}
    ${skinProfile ? `Тип кожи: ${JSON.stringify(skinProfile)}` : ''}
    
    Предложи конкретные продукты российских и международных брендов с указанием:
    - Название бренда и продукта
    - Примерная цена в рублях
    - Где можно купить (Wildberries, Ozon, Летуаль, Рив Гош и т.д.)
    - Краткое описание почему этот продукт подходит
    
    Верни в JSON формате:
    {
      "products": [
        {
          "brand": "Бренд",
          "name": "Название продукта", 
          "price": "1500-2000 руб",
          "store": "Wildberries",
          "reason": "Причина рекомендации"
        }
      ],
      "reasoning": "Общее обоснование выбора"
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Очищаем от markdown форматирования
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse JSON:", text);
      // Возвращаем базовую структуру в случае ошибки
      return {
        products: [],
        reasoning: "Рекомендации временно недоступны"
      };
    }
  } catch (error) {
    console.error("Error generating partner recommendations:", error);
    throw new Error("Failed to generate partner recommendations");
  }
}

export async function researchIngredientSafety(
  ingredientName: string,
  skinType?: string
): Promise<{ safetyProfile: string; recentStudies: string[]; expertOpinions: string[] }> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-8b",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 400,
      }
    });

    const prompt = `Research the latest safety profile for the cosmetic ingredient "${ingredientName}"${skinType ? ` specifically for ${skinType} skin` : ''}.

Provide:
1. Current safety assessment based on latest research
2. Recent clinical studies and findings
3. Expert dermatologist opinions
4. Any regulatory updates or warnings
5. Concentration guidelines and best practices

Respond with JSON:
{
  "safetyProfile": "comprehensive safety assessment",
  "recentStudies": ["recent study findings"],
  "expertOpinions": ["dermatologist expert opinions"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("No JSON found in response:", text);
      return "";
    }
    
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.log("Failed to parse JSON:", jsonMatch[0]);
      return "";
    }
  } catch (error) {
    console.error("Error researching ingredient safety:", error);
    throw new Error("Failed to research ingredient safety: " + (error as Error).message);
  }
}

// Функция для поиска изображения продукта
export async function findProductImage(productName: string): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY не настроен");
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "user",
            content: `Найди официальное изображение продукта "${productName}". Верни только прямую ссылку на изображение в формате: https://example.com/image.jpg`
          }
        ],
        max_tokens: 100,
        temperature: 0.1,
        top_p: 0.8,
        search_recency_filter: "month",
        return_images: true,
        return_related_questions: false,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices[0]?.message?.content?.trim() || "";
    
    // Проверяем, что это действительно URL изображения
    if (imageUrl && (imageUrl.includes('http') && (imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.jpeg')))) {
      return imageUrl;
    }
    
    return "";

  } catch (error) {
    console.error("Error finding product image:", error);
    return "";
  }
}

// Новая функция для персонализированных рекомендаций через Perplexity
export async function getPersonalizedRecommendation(
  productName: string,
  ingredients: string,
  skinProfile?: SkinProfile
): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY не настроен");
  }

  try {
    const skinContext = skinProfile ? `
Тип кожи: ${skinProfile.skinType}
Проблемы кожи: ${skinProfile.skinConcerns.join(', ')}
Аллергии: ${skinProfile.allergies.join(', ')}
Предпочтения: ${skinProfile.preferences.join(', ')}
` : 'Универсальный тип кожи';

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "user",
            content: `На сколько данное средство "${productName}" с составом "${ingredients}" подойдет моему типу кожи с учетом наличия аллергических реакций и состояния кожи? 

Мой профиль кожи:
${skinContext}

Дай ответ до 300 символов`
          }
        ],
        max_tokens: 200,
        temperature: 0.2,
        top_p: 0.8,
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
    return data.choices[0]?.message?.content?.trim() || "";

  } catch (error) {
    console.error("Error getting personalized recommendation:", error);
    return "";
  }
}