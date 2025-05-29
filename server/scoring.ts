import { SkinProfile } from "./gemini";

export interface IngredientScore {
  name: string;
  safetyScore: number; // 0-100
  effectivenessScore: number; // 0-100
  compatibilityScore: number; // 0-100 (с типом кожи)
  allergyRisk: number; // 0-100 (риск аллергии)
  researchBacking: number; // 0-100 (научная поддержка)
}

export interface ProductScore {
  overall: number; // 0-100
  safety: number; // 0-100
  effectiveness: number; // 0-100
  suitability: number; // 0-100 (подходимость для типа кожи)
  innovation: number; // 0-100
  valueForMoney: number; // 0-100
  breakdown: {
    ingredientQuality: number;
    formulationBalance: number;
    skinTypeMatch: number;
    allergyRisk: number;
    scientificEvidence: number;
  };
  recommendation: "excellent" | "good" | "fair" | "poor";
  confidenceLevel: number; // 0-100
}

// Базовые данные о безопасности и эффективности ингредиентов
const INGREDIENT_DATABASE: Record<string, Partial<IngredientScore>> = {
  // Увлажняющие компоненты
  "hyaluronic acid": { safetyScore: 95, effectivenessScore: 90, researchBacking: 95 },
  "glycerin": { safetyScore: 90, effectivenessScore: 85, researchBacking: 90 },
  "ceramides": { safetyScore: 90, effectivenessScore: 88, researchBacking: 85 },
  "squalane": { safetyScore: 95, effectivenessScore: 80, researchBacking: 80 },
  
  // Активные компоненты
  "niacinamide": { safetyScore: 85, effectivenessScore: 90, researchBacking: 95 },
  "retinol": { safetyScore: 70, effectivenessScore: 95, researchBacking: 98 },
  "vitamin c": { safetyScore: 75, effectivenessScore: 90, researchBacking: 90 },
  "salicylic acid": { safetyScore: 80, effectivenessScore: 85, researchBacking: 90 },
  "lactic acid": { safetyScore: 82, effectivenessScore: 80, researchBacking: 85 },
  
  // Успокаивающие компоненты
  "aloe vera": { safetyScore: 95, effectivenessScore: 70, researchBacking: 75 },
  "chamomile": { safetyScore: 90, effectivenessScore: 65, researchBacking: 70 },
  "panthenol": { safetyScore: 95, effectivenessScore: 75, researchBacking: 80 },
  
  // Потенциально проблематичные
  "alcohol": { safetyScore: 40, effectivenessScore: 30, researchBacking: 60 },
  "sulfates": { safetyScore: 50, effectivenessScore: 70, researchBacking: 70 },
  "parabens": { safetyScore: 60, effectivenessScore: 80, researchBacking: 75 },
  "fragrance": { safetyScore: 45, effectivenessScore: 20, researchBacking: 30 },
};

// Коэффициенты совместимости с типами кожи
const SKIN_TYPE_COMPATIBILITY: Record<string, Record<string, number>> = {
  "dry": {
    "hyaluronic acid": 1.2,
    "glycerin": 1.15,
    "ceramides": 1.2,
    "alcohol": 0.3,
    "salicylic acid": 0.7
  },
  "oily": {
    "niacinamide": 1.2,
    "salicylic acid": 1.3,
    "alcohol": 0.8,
    "hyaluronic acid": 1.1
  },
  "sensitive": {
    "aloe vera": 1.3,
    "chamomile": 1.25,
    "panthenol": 1.2,
    "fragrance": 0.2,
    "alcohol": 0.1,
    "retinol": 0.4
  },
  "combination": {
    "niacinamide": 1.15,
    "hyaluronic acid": 1.1,
    "salicylic acid": 1.1
  },
  "normal": {
    // Базовые коэффициенты для нормальной кожи
  }
};

export function scoreIngredient(
  ingredientName: string, 
  skinProfile?: SkinProfile
): IngredientScore {
  const normalizedName = ingredientName.toLowerCase().trim();
  const baseData = INGREDIENT_DATABASE[normalizedName] || {
    safetyScore: 70,
    effectivenessScore: 60,
    researchBacking: 50
  };

  let compatibilityScore = 75; // базовый показатель
  let allergyRisk = 20; // базовый риск

  if (skinProfile) {
    // Проверяем совместимость с типом кожи
    const skinType = skinProfile.skinType.toLowerCase();
    const compatibility = SKIN_TYPE_COMPATIBILITY[skinType]?.[normalizedName] || 1.0;
    compatibilityScore = Math.min(100, compatibilityScore * compatibility);

    // Проверяем аллергии
    const isAllergen = skinProfile.allergies.some(allergy => 
      normalizedName.includes(allergy.toLowerCase()) || 
      allergy.toLowerCase().includes(normalizedName)
    );
    if (isAllergen) {
      allergyRisk = 95;
      compatibilityScore = 10;
    }

    // Проверяем проблемы кожи
    if (skinProfile.skinConcerns.includes("Акне") && normalizedName.includes("acid")) {
      compatibilityScore += 10;
    }
    if (skinProfile.skinConcerns.includes("Сухость") && 
        ["hyaluronic", "glycerin", "ceramides"].some(h => normalizedName.includes(h))) {
      compatibilityScore += 15;
    }
  }

  return {
    name: ingredientName,
    safetyScore: baseData.safetyScore || 70,
    effectivenessScore: baseData.effectivenessScore || 60,
    compatibilityScore: Math.max(0, Math.min(100, compatibilityScore)),
    allergyRisk: Math.max(0, Math.min(100, allergyRisk)),
    researchBacking: baseData.researchBacking || 50
  };
}

export function scoreProduct(
  ingredients: string[],
  productName: string,
  skinProfile?: SkinProfile,
  price?: number
): ProductScore {
  // Оцениваем каждый ингредиент
  const ingredientScores = ingredients.slice(0, 10).map(ing => 
    scoreIngredient(ing, skinProfile)
  );

  // Расчет основных метрик
  const avgSafety = ingredientScores.reduce((sum, ing) => sum + ing.safetyScore, 0) / ingredientScores.length;
  const avgEffectiveness = ingredientScores.reduce((sum, ing) => sum + ing.effectivenessScore, 0) / ingredientScores.length;
  const avgCompatibility = ingredientScores.reduce((sum, ing) => sum + ing.compatibilityScore, 0) / ingredientScores.length;
  const maxAllergyRisk = Math.max(...ingredientScores.map(ing => ing.allergyRisk));
  const avgResearch = ingredientScores.reduce((sum, ing) => sum + ing.researchBacking, 0) / ingredientScores.length;

  // Качество ингредиентов (30% веса)
  const ingredientQuality = (avgSafety * 0.4 + avgEffectiveness * 0.4 + avgResearch * 0.2);

  // Баланс формулы (20% веса)
  const hasActives = ingredientScores.some(ing => ing.effectivenessScore > 80);
  const hasMoisturizers = ingredientScores.some(ing => 
    ["hyaluronic", "glycerin", "ceramides"].some(h => ing.name.toLowerCase().includes(h))
  );
  const formulationBalance = hasActives && hasMoisturizers ? 85 : (hasActives || hasMoisturizers ? 70 : 50);

  // Соответствие типу кожи (25% веса)
  const skinTypeMatch = avgCompatibility;

  // Риск аллергии (15% веса, инвертированный)
  const allergyRisk = 100 - maxAllergyRisk;

  // Научная поддержка (10% веса)
  const scientificEvidence = avgResearch;

  // Общий расчет
  const overall = 
    ingredientQuality * 0.30 +
    formulationBalance * 0.20 +
    skinTypeMatch * 0.25 +
    allergyRisk * 0.15 +
    scientificEvidence * 0.10;

  // Инновационность (бонус за современные ингредиенты)
  const modernIngredients = ["niacinamide", "peptides", "bakuchiol", "azelaic acid"];
  const innovation = modernIngredients.some(modern => 
    ingredients.some(ing => ing.toLowerCase().includes(modern))
  ) ? 80 : 60;

  // Соотношение цена/качество
  let valueForMoney = 70;
  if (price) {
    if (price < 500 && overall > 70) valueForMoney = 90;
    else if (price < 1000 && overall > 75) valueForMoney = 80;
    else if (price > 2000 && overall < 80) valueForMoney = 50;
  }

  // Уровень рекомендации
  let recommendation: "excellent" | "good" | "fair" | "poor";
  if (overall >= 85) recommendation = "excellent";
  else if (overall >= 70) recommendation = "good";
  else if (overall >= 55) recommendation = "fair";
  else recommendation = "poor";

  // Уровень уверенности
  const hasKnownIngredients = ingredientScores.filter(ing => 
    INGREDIENT_DATABASE[ing.name.toLowerCase()]
  ).length;
  const confidenceLevel = Math.min(100, (hasKnownIngredients / ingredientScores.length) * 100);

  return {
    overall: Math.round(overall),
    safety: Math.round(avgSafety),
    effectiveness: Math.round(avgEffectiveness),
    suitability: Math.round(avgCompatibility),
    innovation: Math.round(innovation),
    valueForMoney: Math.round(valueForMoney),
    breakdown: {
      ingredientQuality: Math.round(ingredientQuality),
      formulationBalance: Math.round(formulationBalance),
      skinTypeMatch: Math.round(skinTypeMatch),
      allergyRisk: Math.round(allergyRisk),
      scientificEvidence: Math.round(scientificEvidence)
    },
    recommendation,
    confidenceLevel: Math.round(confidenceLevel)
  };
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-600 bg-green-50";
  if (score >= 70) return "text-blue-600 bg-blue-50";
  if (score >= 55) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

export function getRecommendationIcon(recommendation: string): string {
  switch (recommendation) {
    case "excellent": return "🏆";
    case "good": return "✅";
    case "fair": return "⚠️";
    case "poor": return "❌";
    default: return "📊";
  }
}