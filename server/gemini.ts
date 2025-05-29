import { scoreProduct, scoreIngredient, ProductScore } from "./scoring";

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

export async function analyzeIngredientsWithPerplexity(
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
            content: "You are a cosmetics expert. Return ONLY the clean ingredients list in English without explanations, reasoning or technical information."
          },
          {
            role: "user",
            content: `Find the ingredients list for cosmetic product "${productName}". 

RETURN ONLY: ingredients list in English, separated by commas

DO NOT ADD:
- "Based on available sources..."
- "However..."
- "According to..."
- Any explanations or comments

Example correct answer: "Water, Glycerin, Niacinamide, Cetyl Alcohol, Salicylic Acid"

If ingredients not found, return empty string.`
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
            content: "Ты эксперт по косметическим ингредиентам. Извлекай только настоящие косметические ингредиенты из текста."
          },
          {
            role: "user",
            content: `Извлеки все косметические ингредиенты из следующего текста: "${inputText}"

Правила:
- Только реальные косметические ингредиенты
- Исключи размеры упаковок, цены, описания
- Максимум 15 ингредиентов
- Названия на латинице или русском языке

Ответь в JSON формате:
{
  "ingredients": ["ингредиент1", "ингредиент2", ...]
}`
          }
        ],
        max_tokens: 400,
        temperature: 0.1,
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
    let responseText = data.choices[0]?.message?.content?.trim() || "";
    
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
            content: "Ты эксперт по косметике. Рекомендуй альтернативные продукты на основе анализа."
          },
          {
            role: "user",
            content: `На основе анализа косметического продукта и профиля кожи, предложи 3-4 альтернативных товара для покупки.
    
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
}`
          }
        ],
        max_tokens: 800,
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
            content: "Ты эксперт-дерматолог с доступом к последним научным исследованиям. Отвечай только на русском языке."
          },
          {
            role: "user",
            content: `Исследуй профиль безопасности косметического ингредиента "${ingredientName}"${skinType ? ` специально для кожи типа ${skinType}` : ''}.

Предоставь на русском языке:
1. Текущую оценку безопасности на основе последних исследований
2. Результаты недавних клинических исследований
3. Мнения экспертов-дерматологов
4. Любые регулятивные обновления или предупреждения
5. Рекомендации по концентрации и лучшие практики

ВАЖНО: Отвечай строго на русском языке.

Ответь в формате JSON:
{
  "safetyProfile": "комплексная оценка безопасности на русском языке",
  "recentStudies": ["результаты недавних исследований на русском языке"],
  "expertOpinions": ["мнения экспертов-дерматологов на русском языке"]
}`
          }
        ],
        max_tokens: 600,
        temperature: 0.1,
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
    
    // Очищаем от markdown
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("No JSON found in response:", text);
      return {
        safetyProfile: "Данные о безопасности недоступны",
        recentStudies: [],
        expertOpinions: []
      };
    }
    
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.log("Failed to parse JSON:", jsonMatch[0]);
      return {
        safetyProfile: "Ошибка обработки данных о безопасности",
        recentStudies: [],
        expertOpinions: []
      };
    }
  } catch (error) {
    console.error("Error researching ingredient safety:", error);
    throw new Error("Failed to research ingredient safety: " + (error as Error).message);
  }
}

// Функция для поиска изображения продукта через Perplexity
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
            role: "system",
            content: "Ты эксперт по поиску изображений косметических продуктов. Возвращай ТОЛЬКО прямые ссылки на изображения продуктов."
          },
          {
            role: "user", 
            content: `Find a high-quality product image for cosmetic product "${productName}".

Search on these sources:
- Official brand websites (payot.com, laroche-posay.com, etc.)
- Beauty retailers: Wildberries, Ozon, Sephora, Ulta, Douglas
- Beauty catalogs and product databases

IMPORTANT: Return ONLY a direct image URL in format .jpg, .jpeg, .png or .webp
Do NOT add any text, just the URL!

Example correct answer: https://example.com/product.jpg`
          }
        ],
        max_tokens: 150,
        temperature: 0.1,
        top_p: 0.7,
        search_recency_filter: "week",
        return_images: true,
        return_related_questions: false,
        stream: false
      })
    });

    if (!response.ok) {
      console.log(`Perplexity API error: ${response.status}`);
      return "";
    }

    const data = await response.json();
    let responseText = data.choices[0]?.message?.content?.trim() || "";
    
    // Извлекаем первый найденный URL изображения
    const urlPattern = /(https?:\/\/[^\s\[\]<>"']+\.(?:jpg|jpeg|png|webp)(?:\?[^\s\[\]<>"']*)?)/gi;
    const matches = responseText.match(urlPattern);
    
    if (matches && matches.length > 0) {
      // Берем первый найденный URL и минимально очищаем
      let imageUrl = matches[0].trim();
      
      // Убираем только явно лишние символы в конце
      imageUrl = imageUrl.replace(/[)"'\]\s]+$/, '');
      
      console.log(`Found image for ${productName}: ${imageUrl}`);
      return imageUrl;
    }
    
    console.log(`No valid image URL found for ${productName}`);
    
    // Попробуем альтернативный поиск с упрощенным запросом
    try {
      const fallbackResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: `Search for "${productName}" cosmetic product image. Return only image URL.`
            }
          ],
          max_tokens: 100,
          temperature: 0.1,
          search_recency_filter: "month",
          return_images: true,
          stream: false
        })
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const fallbackText = fallbackData.choices[0]?.message?.content?.trim() || "";
        const fallbackMatches = fallbackText.match(urlPattern);
        
        if (fallbackMatches && fallbackMatches.length > 0) {
          const fallbackUrl = fallbackMatches[0].trim().replace(/[)"'\]\s]+$/, '');
          console.log(`Fallback image found for ${productName}: ${fallbackUrl}`);
          return fallbackUrl;
        }
      }
    } catch (fallbackError) {
      console.log(`Fallback search also failed for ${productName}`);
    }
    
    // Возвращаем URL изображения-заглушки
    return "https://via.placeholder.com/300x300/f3f4f6/6b7280?text=Косметический+продукт";

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