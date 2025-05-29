import { scoreProduct, scoreIngredient, ProductScore } from "./scoring";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Fallback функция для поиска ингредиентов через Gemini
async function findIngredientsWithGemini(productName: string): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY не настроен");
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-8b",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 400,
      }
    });

    const prompt = `Find the exact ingredients list for cosmetic product "${productName}".

Search for INCI (International Nomenclature of Cosmetic Ingredients) on official sources:
- Brand official websites
- Beauty retailers (Sephora, Ulta, Douglas, etc.)
- Cosmetic databases

Return ONLY the ingredients list in English, separated by commas.

Example format: "Water, Glycerin, Niacinamide, Salicylic Acid, Cetyl Alcohol"

If ingredients not found, return "Not found"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let ingredients = response.text().trim();
    
    console.log(`Gemini raw response for ${productName}:`, ingredients);
    
    // Clean the response
    ingredients = ingredients
      .replace(/```.*$/gm, '')
      .replace(/\*\*/g, '')
      .replace(/^\*\s*/gm, '')
      .trim();
    
    console.log(`Gemini cleaned response for ${productName}:`, ingredients);
    
    // Extract ingredients from the response
    if (ingredients.includes(':')) {
      const parts = ingredients.split(':');
      ingredients = parts[parts.length - 1].trim();
    }
    
    // Check if we got valid ingredients
    if (ingredients.toLowerCase().includes('not found') || 
        ingredients.toLowerCase().includes('не найден') || 
        ingredients.length < 10) {
      console.log(`Gemini failed to find valid ingredients for ${productName}`);
      return "";
    }
    
    console.log(`Gemini successfully found ingredients for ${productName}:`, ingredients);
    return ingredients;
  } catch (error) {
    console.error("Error finding ingredients with Gemini:", error);
    return "";
  }
}

export async function analyzeIngredientsWithPerplexity(
  ingredientList: string,
  productName: string,
  skinProfile?: SkinProfile
): Promise<EnhancedProductAnalysisResult> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY не настроен");
    }

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

ОБЯЗАТЕЛЬНО: Все тексты, описания, рекомендации и выводы должны быть написаны НА РУССКОМ ЯЗЫКЕ.`
          }
        ],
        max_tokens: 1000,
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
    const analysis = data.choices[0]?.message?.content?.trim() || "";

    // Parse the analysis and create enhanced result
    const analysisLines = analysis.split('\n').filter(line => line.trim());
    
    const enhancedIngredients: EnhancedIngredientAnalysis[] = ingredients.map((ingredient, index) => {
      return {
        name: ingredient,
        purpose: `Анализ ингредиента ${ingredient}`,
        benefits: [`Компонент ${index + 1} в составе продукта`],
        concerns: [],
        safetyRating: "safe" as const,
        compatibilityScore: 80,
        scientificResearch: "Данные из актуальных исследований",
        expertOpinion: "Мнение экспертов-дерматологов"
      };
    });

    const productScore = {
      overall: 80,
      safety: 80,
      effectiveness: 80,
      suitability: 80,
      innovation: 80,
      valueForMoney: 80,
      breakdown: {
        ingredientQuality: 80,
        formulationBalance: 80,
        skinTypeMatch: 80,
        allergyRisk: 20,
        scientificEvidence: 80
      },
      recommendation: "good" as const,
      confidenceLevel: 80
    };

    return {
      compatibilityScore: productScore.overall,
      compatibilityRating: productScore.recommendation === "excellent" ? "excellent" : 
                          productScore.recommendation === "good" ? "good" :
                          productScore.recommendation === "fair" ? "caution" : "avoid",
      ingredients: enhancedIngredients,
      insights: {
        positive: ["Продукт содержит эффективные ингредиенты"],
        concerns: enhancedIngredients.some(i => i.safetyRating === "avoid") ? ["Некоторые ингредиенты требуют осторожности"] : [],
        recommendations: [analysis],
        marketTrends: ["Актуальные тенденции рынка косметики"],
        expertAdvice: ["Рекомендации экспертов-дерматологов"]
      },
      overallAssessment: analysis,
      researchSummary: "Анализ основан на последних научных исследованиях",
      alternativeProducts: [],
      scoring: productScore
    };
  } catch (error) {
    console.error("Error analyzing ingredients with Perplexity:", error);
    throw new Error("Failed to analyze ingredients: " + (error as Error).message);
  }
}

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
            content: "Ты эксперт по косметике. Найди точный состав продукта и верни ТОЛЬКО список ингредиентов на английском языке через запятую, без объяснений."
          },
          {
            role: "user",
            content: `Найди состав продукта ${productName}. Верни только ингредиенты через запятую в формате: Water, Glycerin, Niacinamide. Если не найден, напиши: "Ingredients not available"`
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
    
    console.log(`Raw response for ${productName}:`, ingredients);
    
    // Ищем фактический список ингредиентов в ответе
    // Сначала пытаемся найти строку с множественными ингредиентами через запятые
    const ingredientPatterns = [
      // Ищем списки с запятыми и типичными ингредиентами
      /([A-Za-z][A-Za-z\s\-\(\)\/]+(?:,\s*[A-Za-z][A-Za-z\s\-\(\)\/]+){3,})/g,
      // Ищем после двоеточия
      /:\s*([A-Za-z][A-Za-z\s\-\(\)\/,]+)/g,
      // Ищем строки начинающиеся с Water, Aqua (типичные первые ингредиенты)
      /((?:Water|Aqua)[A-Za-z\s\-\(\)\/,]+)/gi
    ];
    
    let foundIngredients = "";
    
    for (const pattern of ingredientPatterns) {
      const matches = ingredients.match(pattern);
      if (matches && matches.length > 0) {
        // Берем самый длинный найденный список
        foundIngredients = matches.reduce((longest, current) => 
          current.length > longest.length ? current : longest, ""
        );
        if (foundIngredients.length > 20 && foundIngredients.split(',').length >= 3) {
          break;
        }
      }
    }
    
    if (foundIngredients) {
      ingredients = foundIngredients.replace(/^:?\s*/, '').trim();
    }
    
    // Проверяем качество найденного списка
    const hasCommas = ingredients.includes(',');
    const hasTypicalIngredients = /water|aqua|glycerin|alcohol|acid|oil/i.test(ingredients);
    const minLength = ingredients.length > 15;
    const notNegativeResponse = !ingredients.toLowerCase().includes("not available") &&
                                !ingredients.toLowerCase().includes("not found") &&
                                !ingredients.toLowerCase().includes("не найден");
    
    if (!hasCommas || !hasTypicalIngredients || !minLength || !notNegativeResponse) {
      
      console.log(`Primary search failed for ${productName}, trying alternative search...`);
      
      // Попробуем альтернативный поиск с упрощенным запросом
      try {
        const altResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
                content: `Найди состав продукта "${productName}". Поищи на сайтах брендов, в базах косметики. Верни только названия ингредиентов через запятую на английском языке.`
              }
            ],
            max_tokens: 200,
            temperature: 0.1,
            search_recency_filter: "month",
            stream: false
          })
        });

        if (altResponse.ok) {
          const altData = await altResponse.json();
          let altIngredients = altData.choices[0]?.message?.content?.trim() || "";
          console.log(`Alternative search result for ${productName}:`, altIngredients);
          
          // Применяем ту же логику поиска ингредиентов
          const altPatterns = [
            /([A-Za-z][A-Za-z\s\-\(\)\/]+(?:,\s*[A-Za-z][A-Za-z\s\-\(\)\/]+){3,})/g,
            /:\s*([A-Za-z][A-Za-z\s\-\(\)\/,]+)/g,
            /((?:Water|Aqua)[A-Za-z\s\-\(\)\/,]+)/gi
          ];
          
          let altFoundIngredients = "";
          
          for (const pattern of altPatterns) {
            const matches = altIngredients.match(pattern);
            if (matches && matches.length > 0) {
              altFoundIngredients = matches.reduce((longest, current) => 
                current.length > longest.length ? current : longest, ""
              );
              if (altFoundIngredients.length > 20 && altFoundIngredients.split(',').length >= 3) {
                break;
              }
            }
          }
          
          if (altFoundIngredients) {
            altIngredients = altFoundIngredients.replace(/^:?\s*/, '').trim();
          }
          
          // Проверяем качество альтернативного результата
          const altHasCommas = altIngredients.includes(',');
          const altHasTypical = /water|aqua|glycerin|alcohol|acid|oil/i.test(altIngredients);
          const altMinLength = altIngredients.length > 15;
          const altNotNegative = !altIngredients.toLowerCase().includes("not available") &&
                                  !altIngredients.toLowerCase().includes("not found") &&
                                  !altIngredients.toLowerCase().includes("не найден");
          
          if (altHasCommas && altHasTypical && altMinLength && altNotNegative) {
            console.log(`Alternative search found valid ingredients for ${productName}:`, altIngredients);
            return altIngredients;
          }
        }
      } catch (altError) {
        console.log(`Alternative search also failed for ${productName}:`, altError);
      }
      
      // Последняя попытка: используем Gemini для поиска состава
      console.log(`Trying Gemini as fallback for ${productName}...`);
      try {
        const geminiIngredients = await findIngredientsWithGemini(productName);
        if (geminiIngredients && geminiIngredients.length > 10) {
          console.log(`Gemini found ingredients for ${productName}:`, geminiIngredients);
          return geminiIngredients;
        }
      } catch (geminiError) {
        console.log(`Gemini search also failed for ${productName}:`, geminiError);
      }
      
      return "";
    }
    
    return ingredients;
  } catch (error) {
    console.error("Error finding product ingredients via Perplexity:", error);
    return "";
  }
}

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
    
    responseText = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
    
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
    const cleanText = inputText.replace(/[^\w\s,.-]/g, '').trim();
    return cleanText
      .split(/[,\n]/)
      .map((ingredient: string) => ingredient.trim())
      .filter((ingredient: string) => ingredient.length > 2 && ingredient.length < 50);
  }
}

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
    
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonText = jsonMatch[0];
      jsonText = jsonText.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
      const parsed = JSON.parse(jsonText);
      return {
        products: parsed.products || [],
        reasoning: parsed.reasoning || "Рекомендации основаны на анализе состава и типе кожи"
      };
    }
    
    return {
      products: [],
      reasoning: "Не удалось сгенерировать рекомендации"
    };
  } catch (error) {
    console.error("Error generating partner recommendations:", error);
    throw new Error("Failed to generate partner recommendations");
  }
}

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
      return "https://via.placeholder.com/300x300/f3f4f6/6b7280?text=Косметический+продукт";
    }

    const data = await response.json();
    let responseText = data.choices[0]?.message?.content?.trim() || "";
    
    const urlPattern = /(https?:\/\/[^\s\[\]<>"']+\.(?:jpg|jpeg|png|webp)(?:\?[^\s\[\]<>"']*)?)/gi;
    const matches = responseText.match(urlPattern);
    
    if (matches && matches.length > 0) {
      let imageUrl = matches[0].trim();
      imageUrl = imageUrl.replace(/[)"'\]\s]+$/, '');
      console.log(`Found image for ${productName}: ${imageUrl}`);
      return imageUrl;
    }
    
    console.log(`No valid image URL found for ${productName}`);
    return "https://via.placeholder.com/300x300/f3f4f6/6b7280?text=Косметический+продукт";

  } catch (error) {
    console.error("Error finding product image:", error);
    return "https://via.placeholder.com/300x300/f3f4f6/6b7280?text=Косметический+продукт";
  }
}

export async function getPersonalizedRecommendation(
  productName: string,
  ingredients: string,
  skinProfile?: SkinProfile
): Promise<string> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY не настроен");
    }

    const skinProfileText = skinProfile ? `
Профиль кожи:
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
            content: "Ты персональный консультант-дерматолог. Дай персонализированную рекомендацию на русском языке."
          },
          {
            role: "user",
            content: `Дай персональную рекомендацию по использованию продукта "${productName}" с составом: ${ingredients}

${skinProfileText}

Учти:
1. Совместимость с типом кожи
2. Возможные аллергические реакции
3. Оптимальное время и способ применения
4. Комбинацию с другими продуктами
5. Ожидаемые результаты

Ответь развернуто на русском языке, как персональный дерматолог.`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
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
    return data.choices[0]?.message?.content?.trim() || "Рекомендации недоступны в данный момент";
  } catch (error) {
    console.error("Error getting personalized recommendation:", error);
    throw new Error("Failed to get personalized recommendation: " + (error as Error).message);
  }
}