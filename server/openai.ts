import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface IngredientAnalysis {
  name: string;
  purpose: string;
  benefits: string[];
  concerns: string[];
  safetyRating: "safe" | "caution" | "avoid";
  compatibilityScore: number; // 0-100
}

export interface ProductAnalysisResult {
  compatibilityScore: number;
  compatibilityRating: "excellent" | "good" | "caution" | "avoid";
  ingredients: IngredientAnalysis[];
  insights: {
    positive: string[];
    concerns: string[];
    recommendations: string[];
  };
  overallAssessment: string;
}

export interface SkinProfile {
  skinType: string;
  skinConcerns: string[];
  allergies: string[];
  preferences: string[];
}

export async function analyzeIngredients(
  ingredientList: string,
  skinProfile?: SkinProfile
): Promise<ProductAnalysisResult> {
  try {
    const systemPrompt = `You are a cosmetic ingredient analysis expert. Analyze the provided ingredient list and provide detailed insights. ${
      skinProfile ? `Consider the user's skin profile: Type: ${skinProfile.skinType}, Concerns: ${skinProfile.skinConcerns.join(', ')}, Allergies: ${skinProfile.allergies.join(', ')}, Preferences: ${skinProfile.preferences.join(', ')}.` : ''
    }

Respond with JSON in this exact format:
{
  "compatibilityScore": number (0-100),
  "compatibilityRating": "excellent" | "good" | "caution" | "avoid",
  "ingredients": [
    {
      "name": "ingredient name",
      "purpose": "primary function",
      "benefits": ["benefit1", "benefit2"],
      "concerns": ["concern1", "concern2"],
      "safetyRating": "safe" | "caution" | "avoid",
      "compatibilityScore": number (0-100)
    }
  ],
  "insights": {
    "positive": ["positive insight 1", "positive insight 2"],
    "concerns": ["concern 1", "concern 2"],
    "recommendations": ["recommendation 1", "recommendation 2"]
  },
  "overallAssessment": "detailed overall assessment"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Analyze these ingredients: ${ingredientList}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as ProductAnalysisResult;
  } catch (error) {
    console.error("Error analyzing ingredients:", error);
    throw new Error("Failed to analyze ingredients: " + (error as Error).message);
  }
}

export async function extractIngredientsFromText(text: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting cosmetic ingredient lists from text. Extract all ingredients from the provided text and return them as a clean, standardized list. Respond with JSON in this format: { "ingredients": ["ingredient1", "ingredient2", ...] }`,
        },
        {
          role: "user",
          content: `Extract ingredients from this text: ${text}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.ingredients || [];
  } catch (error) {
    console.error("Error extracting ingredients:", error);
    throw new Error("Failed to extract ingredients: " + (error as Error).message);
  }
}

export async function generateProductRecommendations(
  skinProfile: SkinProfile,
  analyzedProducts: any[]
): Promise<{ recommendations: string[]; reasoning: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a skincare expert. Based on the user's skin profile and previously analyzed products, provide personalized product recommendations. Respond with JSON in this format: { "recommendations": ["recommendation1", "recommendation2"], "reasoning": "explanation of recommendations" }`,
        },
        {
          role: "user",
          content: `Skin Profile: ${JSON.stringify(skinProfile)}\nAnalyzed Products: ${JSON.stringify(analyzedProducts)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw new Error("Failed to generate recommendations: " + (error as Error).message);
  }
}
