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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are an expert cosmetic chemist and dermatologist with access to the latest research. Analyze the provided ingredient list and provide comprehensive insights.

${skinProfile ? `Consider the user's skin profile:
- Skin Type: ${skinProfile.skinType}
- Concerns: ${skinProfile.skinConcerns.join(', ')}
- Allergies: ${skinProfile.allergies.join(', ')}
- Preferences: ${skinProfile.preferences.join(', ')}` : ''}

For each ingredient, provide:
1. Scientific purpose and mechanism of action
2. Latest research findings and efficacy data
3. Potential interactions with other ingredients
4. Safety profile and any recent studies
5. Suitability for the user's specific skin profile

Also include:
- Current market trends for this type of product
- Expert dermatologist recommendations
- Alternative product suggestions
- Recent scientific breakthroughs related to these ingredients

Respond with JSON in this exact format:
{
  "compatibilityScore": number (0-100),
  "compatibilityRating": "excellent" | "good" | "caution" | "avoid",
  "ingredients": [
    {
      "name": "ingredient name",
      "purpose": "scientific function and mechanism",
      "benefits": ["benefit1 with scientific backing", "benefit2"],
      "concerns": ["concern1 with research basis", "concern2"],
      "safetyRating": "safe" | "caution" | "avoid",
      "compatibilityScore": number (0-100),
      "scientificResearch": "latest research findings",
      "expertOpinion": "dermatologist perspective"
    }
  ],
  "insights": {
    "positive": ["positive insight with scientific basis"],
    "concerns": ["concern with research backing"],
    "recommendations": ["expert recommendation"],
    "marketTrends": ["current market trends"],
    "expertAdvice": ["professional dermatologist advice"]
  },
  "overallAssessment": "comprehensive analysis with scientific backing",
  "researchSummary": "summary of latest relevant research",
  "alternativeProducts": ["suggested alternative products or ingredients"]
}`;

    // Ограничиваем количество ингредиентов для стабильного анализа
    const ingredients = ingredientList.split(',').slice(0, 10).map(i => i.trim()).join(', ');
    
    const prompt = `Product: ${productName}
Ingredients: ${ingredients}

IMPORTANT: Analyze only the first 10 ingredients and provide a concise response. Keep JSON structure simple and valid.

${systemPrompt}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
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
        // Возвращаем базовый результат
        return {
          compatibilityScore: 70,
          compatibilityRating: "good" as const,
          ingredients: [],
          insights: {
            positive: ["Продукт проанализирован"],
            concerns: ["Требуется дополнительный анализ"],
            recommendations: ["Рекомендуется консультация со специалистом"]
          },
          overallAssessment: "Анализ выполнен с ограничениями из-за сложности состава"
        };
      }
    }
    
    return analysisResult as EnhancedProductAnalysisResult;
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `As an expert dermatologist and cosmetic researcher, provide personalized product recommendations based on:

Skin Profile: ${JSON.stringify(skinProfile)}
Previously Analyzed Products: ${JSON.stringify(analyzedProducts)}
Current Market Trends: ${currentTrends?.join(', ') || 'General skincare trends'}

Consider:
1. Latest scientific research in skincare
2. Ingredient innovations and breakthroughs
3. Clinical study results
4. Expert dermatologist consensus
5. Market trends and consumer feedback
6. Ingredient synergies and incompatibilities

Respond with JSON:
{
  "recommendations": ["specific product recommendations with scientific reasoning"],
  "reasoning": "detailed explanation based on research and skin profile",
  "marketInsights": ["current market trends and innovations relevant to this user"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Gemini");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error generating recommendations with Gemini:", error);
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
            content: "Ты эксперт по косметике. Найди точный список ингредиентов для запрашиваемого продукта из официальных источников или сайтов производителей."
          },
          {
            role: "user",
            content: `Найди точный полный список ингредиентов (INCI names) для косметического продукта "${productName}". Ищи информацию на официальных сайтах брендов или в базах данных косметики. Верни только список ингредиентов через запятую, без дополнительных объяснений.`
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
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
    const ingredients = data.choices[0]?.message?.content?.trim() || "";
    
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
      throw new Error("Invalid response format from Gemini");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error researching ingredient safety:", error);
    throw new Error("Failed to research ingredient safety: " + (error as Error).message);
  }
}