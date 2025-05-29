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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    const prompt = `Product: ${productName}
Ingredients: ${ingredientList}

${systemPrompt}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Gemini");
    }
    
    const analysisResult = JSON.parse(jsonMatch[0]);
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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

export async function researchIngredientSafety(
  ingredientName: string,
  skinType?: string
): Promise<{ safetyProfile: string; recentStudies: string[]; expertOpinions: string[] }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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