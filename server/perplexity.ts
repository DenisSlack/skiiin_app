import { GoogleGenerativeAI } from "@google/generative-ai";

// Интерфейсы
export interface SkinProfile {
  skinType: string;
  skinConcerns: string[];
  allergies: string[];
  preferences: string[];
}

export interface EnhancedIngredientAnalysis {
  name: string;
  purpose: string;
  benefits: string[];
  concerns: string[];
  safetyRating: "safe" | "caution" | "avoid";
  compatibilityScore: number;
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
  recommendation: "excellent" | "good" | "fair" | "poor";
  confidenceLevel: number;
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

// Поиск ингредиентов продукта
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
            content: "Выдай результат в виде списка ингредиентов указанных в составе данного продукта. Никаких объяснений, только список через запятую НА АНГЛИЙСКОМ ЯЗЫКЕ."
          },
          {
            role: "user",
            content: `Find COMPLETE ingredients list for "${productName}". Return FULL INCI list with ALL ingredients in English, like: Water, Glycerin, Cetearyl Alcohol, Dimethicone, Niacinamide, Ceramide NP, Ceramide AP, Hyaluronic Acid, Cholesterol, Phenoxyethanol, Ethylhexylglycerin`
          }
        ],
        max_tokens: 500,
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
    let rawResponse = data.choices[0]?.message?.content?.trim() || "";
    
    console.log(`Raw response for ${productName}:`, rawResponse);
    
    // Извлекаем список ингредиентов из ответа
    let ingredients = rawResponse;
    
    // Убираем лишние фразы если они есть
    ingredients = ingredients
      .replace(/.*(?:состав|ingredients|включает)[:\s]*/gi, '')
      .replace(/^[-•\s]*/gm, '')
      .replace(/\n/g, ', ')
      .trim();
    
    // Проверяем что получили валидный список
    const ingredientCount = ingredients.split(',').length;
    const hasValidIngredients = ingredientCount >= 3 && ingredients.length >= 10;
    const notErrorResponse = !ingredients.includes("not available") && 
                             !ingredients.includes("не найден") &&
                             !ingredients.includes("не найдено");
    
    if (!hasValidIngredients || !notErrorResponse) {
      console.log(`No valid ingredients found for ${productName}. Count: ${ingredientCount}, Length: ${ingredients.length}`);
      return "";
    }
    
    console.log(`Extracted ingredients for ${productName}:`, ingredients);
    return ingredients;
  } catch (error) {
    console.error("Error finding product ingredients via Perplexity:", error);
    return "";
  }
}

// Анализ ингредиентов через Perplexity
export async function analyzeIngredientsWithPerplexity(
  ingredientList: string,
  productName: string,
  skinProfile?: SkinProfile
): Promise<EnhancedProductAnalysisResult> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY не настроен");
    }

    const skinInfo = skinProfile ? `
Профиль кожи:
- Тип кожи: ${skinProfile.skinType}
- Проблемы: ${skinProfile.skinConcerns.join(', ')}
- Аллергии: ${skinProfile.allergies.join(', ')}
- Предпочтения: ${skinProfile.preferences.join(', ')}
` : "";

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
            content: `Ты эксперт-косметолог. Проанализируй состав косметического продукта и дай подробную оценку на русском языке. 
            
Отвечай строго в JSON формате:
{
  "compatibilityScore": число от 0 до 100,
  "compatibilityRating": "excellent" | "good" | "caution" | "avoid",
  "ingredients": [
    {
      "name": "название ингредиента",
      "purpose": "назначение",
      "benefits": ["польза1", "польза2"],
      "concerns": ["проблема1", "проблема2"],
      "safetyRating": "safe" | "caution" | "avoid",
      "compatibilityScore": число от 0 до 100
    }
  ],
  "insights": {
    "positive": ["положительный момент 1", "положительный момент 2"],
    "concerns": ["беспокойство 1", "беспокойство 2"],
    "recommendations": ["рекомендация 1", "рекомендация 2"]
  },
  "overallAssessment": "общая оценка продукта"
}`
          },
          {
            role: "user",
            content: `Проанализируй состав продукта "${productName}":
            
Ингредиенты: ${ingredientList}

${skinInfo}

Дай детальную оценку каждого ингредиента и общую совместимость с типом кожи.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
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
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      // Очищаем JSON от возможных проблем
      let cleanJson = jsonMatch[0]
        .replace(/,\s*}/g, '}')  // Убираем лишние запятые
        .replace(/,\s*]/g, ']')  // Убираем лишние запятые в массивах
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":'); // Добавляем кавычки к ключам
      
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON parse error in analysis:", parseError);
      console.error("Raw response:", text);
      
      // Возвращаем базовую структуру при ошибке
      return {
        compatibilityScore: 75,
        compatibilityRating: "good",
        ingredients: ingredientList.split(',').map(name => ({
          name: name.trim(),
          purpose: "Не удалось определить",
          benefits: ["Требует дополнительного анализа"],
          concerns: [],
          safetyRating: "safe",
          compatibilityScore: 75
        })),
        insights: {
          positive: ["Продукт содержит основные увлажняющие компоненты"],
          concerns: ["Требуется более детальный анализ состава"],
          recommendations: ["Проконсультируйтесь с косметологом для персональных рекомендаций"]
        },
        overallAssessment: "Базовый анализ выполнен. Для более точной оценки необходим дополнительный анализ."
      };
    }
  } catch (error) {
    console.error("Error analyzing ingredients with Perplexity:", error);
    throw new Error("Failed to analyze ingredients: " + (error as Error).message);
  }
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
export async function findProductImage(productName: string): Promise<string> {
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
            role: "user",
            content: `Find official product image URL for cosmetic product: ${productName}. Return only the direct image URL.`
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
        return_images: true
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || "";
    
    const urlRegex = /https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|webp)/gi;
    const matches = content.match(urlRegex);
    
    if (matches && matches.length > 0) {
      console.log(`Found image for ${productName}:`, matches[0]);
      return matches[0];
    }
    
    console.log(`No valid image URL found for ${productName}`);
    return "";
  } catch (error) {
    console.error("Error finding product image:", error);
    return "";
  }
}

// Генерация партнерских рекомендаций
export async function generatePartnerRecommendations(
  productName: string,
  skinProfile?: SkinProfile
): Promise<any> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY не настроен");
    }

    const skinInfo = skinProfile ? `
Профиль кожи: ${skinProfile.skinType}
Проблемы: ${skinProfile.skinConcerns.join(', ')}
Аллергии: ${skinProfile.allergies.join(', ')}
` : "";

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
            content: `Ты эксперт по косметике. Предложи 3-5 альтернативных продуктов схожего действия.
            
Отвечай в JSON формате:
{
  "products": [
    {
      "name": "название продукта",
      "brand": "бренд",
      "price": "примерная цена",
      "keyIngredients": ["ключевой ингредиент 1", "ключевой ингредиент 2"],
      "benefits": ["преимущество 1", "преимущество 2"],
      "suitability": "для какого типа кожи"
    }
  ],
  "reasoning": "объяснение выбора этих продуктов"
}`
          },
          {
            role: "user",
            content: `Подбери альтернативы для продукта "${productName}".
            
${skinInfo}

Учитывай профиль кожи пользователя.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.4,
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
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse error in partner recommendations:", parseError);
      console.error("Raw response:", text);
      // Возвращаем базовую структуру при ошибке парсинга
      return {
        products: [],
        reasoning: "Не удалось получить рекомендации из-за ошибки обработки данных"
      };
    }
  } catch (error) {
    console.error("Error generating partner recommendations:", error);
    throw new Error("Failed to generate partner recommendations");
  }
}

// Персонализированные рекомендации
export async function getPersonalizedRecommendation(
  productName: string,
  ingredients: string,
  skinProfile?: SkinProfile
): Promise<string> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY не настроен");
    }

    const skinInfo = skinProfile ? `
Профиль кожи:
- Тип: ${skinProfile.skinType}
- Проблемы: ${skinProfile.skinConcerns.join(', ')}
- Аллергии: ${skinProfile.allergies.join(', ')}
` : "";

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
            content: "Ты персональный консультант по косметике. Дай практические рекомендации по использованию продукта на русском языке."
          },
          {
            role: "user",
            content: `Дай персональные рекомендации для продукта "${productName}" с составом: ${ingredients}
            
${skinInfo}

Включи советы по:
- Как правильно использовать
- С чем сочетать
- Чего избегать
- Ожидаемые результаты`
          }
        ],
        max_tokens: 800,
        temperature: 0.4,
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
    throw new Error("Failed to get personalized recommendation");
  }
}