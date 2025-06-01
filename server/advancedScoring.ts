import { SkinProfile } from "./gemini";

// Расширенная модель скоринга для космической продукции
export interface AdvancedProductScore {
  // Основные оценки (0-100)
  overall: number;
  safety: number;
  effectiveness: number;
  suitability: number;
  innovation: number;
  valueForMoney: number;
  
  // Детальная разбивка
  breakdown: {
    ingredientQuality: number;
    formulationBalance: number;
    skinTypeMatch: number;
    allergyRisk: number;
    scientificEvidence: number;
    brandReputation: number;
    pricePerformance: number;
    sustainabilityScore: number;
  };
  
  // Категориальные оценки
  categories: {
    hydration: number;
    antiAging: number;
    protection: number;
    gentleness: number;
    absorption: number;
    longevity: number;
  };
  
  // Рекомендации и предупреждения
  recommendation: "excellent" | "good" | "fair" | "poor";
  confidenceLevel: number;
  riskLevel: "low" | "medium" | "high";
  
  // Персонализированные советы
  personalizedAdvice: string[];
  warnings: string[];
  alternatives: string[];
  
  // Метрики для сравнения
  competitorComparison: {
    betterThan: number; // процент конкурентов
    category: string;
    strongPoints: string[];
    weakPoints: string[];
  };
}

export interface IngredientScore {
  name: string;
  concentration?: number; // если известна
  safetyScore: number;
  effectivenessScore: number;
  compatibilityScore: number;
  allergyRisk: number;
  researchBacking: number;
  innovation: number;
  naturalness: number; // насколько натуральный ингредиент
}

// База данных известных ингредиентов с их характеристиками
const INGREDIENT_DATABASE: Record<string, Partial<IngredientScore>> = {
  "Water": { safetyScore: 100, effectivenessScore: 60, allergyRisk: 0, naturalness: 100 },
  "Aqua": { safetyScore: 100, effectivenessScore: 60, allergyRisk: 0, naturalness: 100 },
  "Glycerin": { safetyScore: 95, effectivenessScore: 85, allergyRisk: 5, naturalness: 90 },
  "Hyaluronic Acid": { safetyScore: 95, effectivenessScore: 95, allergyRisk: 2, naturalness: 85, innovation: 90 },
  "Sodium Hyaluronate": { safetyScore: 95, effectivenessScore: 95, allergyRisk: 2, naturalness: 85, innovation: 85 },
  "Retinol": { safetyScore: 70, effectivenessScore: 95, allergyRisk: 25, naturalness: 30, innovation: 95 },
  "Retinyl Palmitate": { safetyScore: 80, effectivenessScore: 75, allergyRisk: 15, naturalness: 40, innovation: 80 },
  "Niacinamide": { safetyScore: 90, effectivenessScore: 90, allergyRisk: 5, naturalness: 80, innovation: 85 },
  "Vitamin C": { safetyScore: 85, effectivenessScore: 90, allergyRisk: 10, naturalness: 95, innovation: 80 },
  "Ascorbic Acid": { safetyScore: 85, effectivenessScore: 90, allergyRisk: 10, naturalness: 95, innovation: 80 },
  "Salicylic Acid": { safetyScore: 80, effectivenessScore: 85, allergyRisk: 15, naturalness: 70, innovation: 75 },
  "Glycolic Acid": { safetyScore: 75, effectivenessScore: 85, allergyRisk: 20, naturalness: 60, innovation: 80 },
  "Lactic Acid": { safetyScore: 85, effectivenessScore: 80, allergyRisk: 10, naturalness: 90, innovation: 75 },
  "Peptides": { safetyScore: 90, effectivenessScore: 85, allergyRisk: 5, naturalness: 70, innovation: 95 },
  "Ceramides": { safetyScore: 95, effectivenessScore: 90, allergyRisk: 2, naturalness: 85, innovation: 85 },
  "Squalane": { safetyScore: 95, effectivenessScore: 85, allergyRisk: 2, naturalness: 90, innovation: 80 },
  "Dimethicone": { safetyScore: 85, effectivenessScore: 70, allergyRisk: 5, naturalness: 20, innovation: 60 },
  "Cetearyl Alcohol": { safetyScore: 90, effectivenessScore: 70, allergyRisk: 8, naturalness: 75, innovation: 50 },
  "Phenoxyethanol": { safetyScore: 85, effectivenessScore: 60, allergyRisk: 10, naturalness: 20, innovation: 40 },
  "Sodium Hydroxide": { safetyScore: 70, effectivenessScore: 50, allergyRisk: 20, naturalness: 30, innovation: 30 },
  "Fragrance": { safetyScore: 60, effectivenessScore: 30, allergyRisk: 35, naturalness: 40, innovation: 20 },
  "Parfum": { safetyScore: 60, effectivenessScore: 30, allergyRisk: 35, naturalness: 40, innovation: 20 },
};

// Веса для различных типов кожи
const SKIN_TYPE_WEIGHTS = {
  "oily": {
    hydration: 0.7,
    mattifying: 1.2,
    poreControl: 1.3,
    gentleness: 0.9
  },
  "dry": {
    hydration: 1.5,
    nourishment: 1.3,
    barrier: 1.2,
    gentleness: 1.1
  },
  "sensitive": {
    gentleness: 1.5,
    hypoallergenic: 1.4,
    naturalness: 1.2,
    fragrance: 0.3
  },
  "combination": {
    balance: 1.3,
    versatility: 1.2,
    hydration: 1.0,
    mattifying: 0.8
  },
  "normal": {
    maintenance: 1.1,
    prevention: 1.2,
    balance: 1.0
  }
};

export function scoreAdvancedIngredient(
  name: string,
  skinProfile?: SkinProfile
): IngredientScore {
  const baseData = INGREDIENT_DATABASE[name] || {};
  
  // Базовые оценки с fallback значениями
  const base: IngredientScore = {
    name,
    safetyScore: baseData.safetyScore || 75,
    effectivenessScore: baseData.effectivenessScore || 70,
    compatibilityScore: 75,
    allergyRisk: baseData.allergyRisk || 10,
    researchBacking: baseData.researchBacking || 70,
    innovation: baseData.innovation || 60,
    naturalness: baseData.naturalness || 60
  };

  // Корректировка на основе профиля кожи
  if (skinProfile) {
    const skinType = skinProfile.skinType?.toLowerCase();
    
    // Для чувствительной кожи
    if (skinType === "sensitive") {
      base.compatibilityScore = Math.max(0, base.compatibilityScore - (base.allergyRisk * 2));
      if (base.naturalness > 80) base.compatibilityScore += 10;
    }
    
    // Для сухой кожи
    if (skinType === "dry") {
      if (name.toLowerCase().includes("glycerin") || 
          name.toLowerCase().includes("hyaluronic") ||
          name.toLowerCase().includes("ceramide")) {
        base.compatibilityScore += 15;
      }
    }
    
    // Для жирной кожи
    if (skinType === "oily") {
      if (name.toLowerCase().includes("acid") && !name.toLowerCase().includes("hyaluronic")) {
        base.compatibilityScore += 10;
      }
      if (name.toLowerCase().includes("oil") || 
          name.toLowerCase().includes("butter")) {
        base.compatibilityScore -= 15;
      }
    }

    // Проверка аллергий
    if (skinProfile.allergies?.some(allergy => 
        name.toLowerCase().includes(allergy.toLowerCase()))) {
      base.compatibilityScore = Math.max(0, base.compatibilityScore - 50);
      base.allergyRisk = Math.min(100, base.allergyRisk + 40);
    }
  }

  // Нормализация значений
  base.safetyScore = Math.max(0, Math.min(100, base.safetyScore));
  base.effectivenessScore = Math.max(0, Math.min(100, base.effectivenessScore));
  base.compatibilityScore = Math.max(0, Math.min(100, base.compatibilityScore));
  base.allergyRisk = Math.max(0, Math.min(100, base.allergyRisk));
  base.researchBacking = Math.max(0, Math.min(100, base.researchBacking));
  base.innovation = Math.max(0, Math.min(100, base.innovation));
  base.naturalness = Math.max(0, Math.min(100, base.naturalness));

  return base;
}

export function scoreAdvancedProduct(
  ingredients: string[],
  productName: string,
  skinProfile?: SkinProfile,
  brandInfo?: { reputation: number; priceRange: string }
): AdvancedProductScore {
  
  // Анализ ингредиентов
  const ingredientScores = ingredients.map(ing => 
    scoreAdvancedIngredient(ing.trim(), skinProfile)
  );

  // Базовые метрики
  const avgSafety = ingredientScores.reduce((sum, ing) => sum + ing.safetyScore, 0) / ingredientScores.length;
  const avgEffectiveness = ingredientScores.reduce((sum, ing) => sum + ing.effectivenessScore, 0) / ingredientScores.length;
  const avgCompatibility = ingredientScores.reduce((sum, ing) => sum + ing.compatibilityScore, 0) / ingredientScores.length;
  const maxAllergyRisk = Math.max(...ingredientScores.map(ing => ing.allergyRisk));
  const avgResearch = ingredientScores.reduce((sum, ing) => sum + ing.researchBacking, 0) / ingredientScores.length;
  const avgInnovation = ingredientScores.reduce((sum, ing) => sum + ing.innovation, 0) / ingredientScores.length;
  const avgNaturalness = ingredientScores.reduce((sum, ing) => sum + ing.naturalness, 0) / ingredientScores.length;

  // Детальная разбивка
  const breakdown = {
    ingredientQuality: (avgSafety + avgEffectiveness) / 2,
    formulationBalance: calculateFormulationBalance(ingredientScores),
    skinTypeMatch: avgCompatibility,
    allergyRisk: Math.max(0, 100 - maxAllergyRisk),
    scientificEvidence: avgResearch,
    brandReputation: brandInfo?.reputation || 75,
    pricePerformance: calculatePricePerformance(brandInfo?.priceRange || "medium", avgEffectiveness),
    sustainabilityScore: avgNaturalness
  };

  // Категориальные оценки
  const categories = {
    hydration: calculateHydrationScore(ingredientScores),
    antiAging: calculateAntiAgingScore(ingredientScores),
    protection: calculateProtectionScore(ingredientScores),
    gentleness: Math.max(0, 100 - maxAllergyRisk),
    absorption: calculateAbsorptionScore(ingredientScores),
    longevity: calculateLongevityScore(ingredientScores)
  };

  // Основные оценки
  const safety = avgSafety;
  const effectiveness = avgEffectiveness;
  const suitability = avgCompatibility;
  const innovation = avgInnovation;
  const valueForMoney = breakdown.pricePerformance;
  
  const overall = (
    safety * 0.25 +
    effectiveness * 0.25 +
    suitability * 0.20 +
    innovation * 0.15 +
    valueForMoney * 0.15
  );

  // Определение рекомендации
  let recommendation: "excellent" | "good" | "fair" | "poor";
  if (overall >= 85) recommendation = "excellent";
  else if (overall >= 70) recommendation = "good";
  else if (overall >= 55) recommendation = "fair";
  else recommendation = "poor";

  // Уровень риска
  let riskLevel: "low" | "medium" | "high";
  if (maxAllergyRisk <= 10) riskLevel = "low";
  else if (maxAllergyRisk <= 25) riskLevel = "medium";
  else riskLevel = "high";

  // Персонализированные советы
  const personalizedAdvice = generatePersonalizedAdvice(ingredientScores, skinProfile, categories);
  const warnings = generateWarnings(ingredientScores, skinProfile, maxAllergyRisk);
  const alternatives = generateAlternatives(productName, recommendation, skinProfile);

  // Сравнение с конкурентами
  const competitorComparison = {
    betterThan: Math.round(overall * 0.8), // Примерный процент
    category: detectProductCategory(productName),
    strongPoints: identifyStrongPoints(breakdown, categories),
    weakPoints: identifyWeakPoints(breakdown, categories)
  };

  return {
    overall: Math.round(overall),
    safety: Math.round(safety),
    effectiveness: Math.round(effectiveness),
    suitability: Math.round(suitability),
    innovation: Math.round(innovation),
    valueForMoney: Math.round(valueForMoney),
    breakdown: {
      ingredientQuality: Math.round(breakdown.ingredientQuality),
      formulationBalance: Math.round(breakdown.formulationBalance),
      skinTypeMatch: Math.round(breakdown.skinTypeMatch),
      allergyRisk: Math.round(breakdown.allergyRisk),
      scientificEvidence: Math.round(breakdown.scientificEvidence),
      brandReputation: Math.round(breakdown.brandReputation),
      pricePerformance: Math.round(breakdown.pricePerformance),
      sustainabilityScore: Math.round(breakdown.sustainabilityScore)
    },
    categories: {
      hydration: Math.round(categories.hydration),
      antiAging: Math.round(categories.antiAging),
      protection: Math.round(categories.protection),
      gentleness: Math.round(categories.gentleness),
      absorption: Math.round(categories.absorption),
      longevity: Math.round(categories.longevity)
    },
    recommendation,
    confidenceLevel: Math.round(85 + (avgResearch - 70) * 0.3),
    riskLevel,
    personalizedAdvice,
    warnings,
    alternatives,
    competitorComparison
  };
}

// Вспомогательные функции для расчетов

function calculateFormulationBalance(ingredients: IngredientScore[]): number {
  // Проверяем баланс активных и вспомогательных ингредиентов
  const activeIngredients = ingredients.filter(ing => ing.effectivenessScore > 80).length;
  const totalIngredients = ingredients.length;
  
  if (totalIngredients === 0) return 50;
  
  const activeRatio = activeIngredients / totalIngredients;
  const idealRatio = 0.3; // 30% активных ингредиентов оптимально
  
  return Math.max(0, 100 - Math.abs(activeRatio - idealRatio) * 200);
}

function calculateHydrationScore(ingredients: IngredientScore[]): number {
  const hydratingIngredients = [
    "glycerin", "hyaluronic", "sodium hyaluronate", "glycolic", "lactic", "ceramide", "squalane"
  ];
  
  let score = 0;
  ingredients.forEach(ing => {
    if (hydratingIngredients.some(hydrating => 
        ing.name.toLowerCase().includes(hydrating))) {
      score += ing.effectivenessScore;
    }
  });
  
  return Math.min(100, score / 2);
}

function calculateAntiAgingScore(ingredients: IngredientScore[]): number {
  const antiAgingIngredients = [
    "retinol", "retinyl", "vitamin c", "ascorbic", "peptide", "niacinamide", "glycolic", "lactic"
  ];
  
  let score = 0;
  ingredients.forEach(ing => {
    if (antiAgingIngredients.some(antiAging => 
        ing.name.toLowerCase().includes(antiAging))) {
      score += ing.effectivenessScore;
    }
  });
  
  return Math.min(100, score / 2);
}

function calculateProtectionScore(ingredients: IngredientScore[]): number {
  const protectiveIngredients = [
    "zinc oxide", "titanium dioxide", "avobenzone", "octinoxate", "antioxidant", "vitamin e", "vitamin c"
  ];
  
  let score = 0;
  ingredients.forEach(ing => {
    if (protectiveIngredients.some(protective => 
        ing.name.toLowerCase().includes(protective))) {
      score += ing.effectivenessScore;
    }
  });
  
  return Math.min(100, score / 3);
}

function calculateAbsorptionScore(ingredients: IngredientScore[]): number {
  // Легкие ингредиенты повышают абсорбцию
  const lightIngredients = ["squalane", "jojoba", "caprylic", "dimethicone"];
  const heavyIngredients = ["petrolatum", "mineral oil", "lanolin"];
  
  let score = 70; // базовая оценка
  
  ingredients.forEach(ing => {
    if (lightIngredients.some(light => ing.name.toLowerCase().includes(light))) {
      score += 5;
    }
    if (heavyIngredients.some(heavy => ing.name.toLowerCase().includes(heavy))) {
      score -= 10;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}

function calculateLongevityScore(ingredients: IngredientScore[]): number {
  // Стабильные ингредиенты повышают долговечность эффекта
  const stableIngredients = ["ceramide", "peptide", "niacinamide", "squalane"];
  
  let score = 65; // базовая оценка
  
  ingredients.forEach(ing => {
    if (stableIngredients.some(stable => ing.name.toLowerCase().includes(stable))) {
      score += 8;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}

function calculatePricePerformance(priceRange: string, effectiveness: number): number {
  const priceMultipliers = {
    "low": 1.2,
    "medium": 1.0,
    "high": 0.8,
    "luxury": 0.6
  };
  
  const multiplier = priceMultipliers[priceRange as keyof typeof priceMultipliers] || 1.0;
  return Math.min(100, effectiveness * multiplier);
}

function generatePersonalizedAdvice(
  ingredients: IngredientScore[], 
  skinProfile?: SkinProfile,
  categories?: any
): string[] {
  const advice: string[] = [];
  
  if (!skinProfile) {
    advice.push("Заполните профиль кожи для персонализированных рекомендаций");
    return advice;
  }

  // Советы по типу кожи
  switch (skinProfile.skinType?.toLowerCase()) {
    case "dry":
      if (categories?.hydration < 70) {
        advice.push("Для сухой кожи рекомендуется использовать дополнительный увлажняющий крем");
      }
      advice.push("Наносите на влажную кожу для лучшего эффекта");
      break;
    
    case "oily":
      advice.push("Используйте тонким слоем, избегайте перенасыщения");
      if (categories?.hydration > 80) {
        advice.push("Продукт может быть слишком питательным - используйте 2-3 раза в неделю");
      }
      break;
    
    case "sensitive":
      advice.push("Проведите тест на небольшом участке кожи перед полным применением");
      advice.push("Начните с использования через день для адаптации кожи");
      break;
  }

  // Советы по возрасту (если доступно в профиле)
  const userAge = (skinProfile as any)?.age;
  if (userAge && userAge > 35) {
    if (categories?.antiAging > 70) {
      advice.push("Отличный выбор для антивозрастного ухода");
    } else {
      advice.push("Рассмотрите добавление антивозрастных активов в уход");
    }
  }

  return advice;
}

function generateWarnings(
  ingredients: IngredientScore[], 
  skinProfile?: SkinProfile,
  maxAllergyRisk?: number
): string[] {
  const warnings: string[] = [];
  
  if (maxAllergyRisk && maxAllergyRisk > 25) {
    warnings.push("Продукт содержит потенциально аллергенные компоненты");
  }
  
  const hasRetinol = ingredients.some(ing => 
    ing.name.toLowerCase().includes("retinol") || ing.name.toLowerCase().includes("retinyl"));
  if (hasRetinol) {
    warnings.push("Содержит ретинол - используйте только вечером и с SPF днем");
  }
  
  const hasAcids = ingredients.some(ing => 
    ing.name.toLowerCase().includes("acid") && !ing.name.toLowerCase().includes("hyaluronic"));
  if (hasAcids) {
    warnings.push("Содержит кислоты - может повысить чувствительность к солнцу");
  }

  if (skinProfile?.allergies?.length) {
    const allergenPresent = ingredients.some(ing =>
      skinProfile.allergies!.some(allergy => 
        ing.name.toLowerCase().includes(allergy.toLowerCase())));
    
    if (allergenPresent) {
      warnings.push("⚠️ ВНИМАНИЕ: Продукт содержит компоненты из вашего списка аллергий!");
    }
  }
  
  return warnings;
}

function generateAlternatives(
  productName: string, 
  recommendation: string,
  skinProfile?: SkinProfile
): string[] {
  const alternatives: string[] = [];
  
  if (recommendation === "poor" || recommendation === "fair") {
    alternatives.push("CeraVe Moisturizing Cream - более безопасная альтернатива");
    alternatives.push("The Ordinary Hyaluronic Acid 2% + B5 - эффективное увлажнение");
    alternatives.push("La Roche-Posay Toleriane - для чувствительной кожи");
  }
  
  return alternatives;
}

function detectProductCategory(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes("cream") || name.includes("крем")) return "Увлажняющие кремы";
  if (name.includes("serum") || name.includes("сыворотка")) return "Сыворотки";
  if (name.includes("cleanser") || name.includes("очищающее")) return "Очищающие средства";
  if (name.includes("sunscreen") || name.includes("spf")) return "Солнцезащитные средства";
  if (name.includes("mask") || name.includes("маска")) return "Маски для лица";
  
  return "Средства по уходу за кожей";
}

function identifyStrongPoints(breakdown: any, categories: any): string[] {
  const points: string[] = [];
  
  if (breakdown.ingredientQuality > 80) points.push("Высокое качество ингредиентов");
  if (breakdown.scientificEvidence > 80) points.push("Научно обоснованная формула");
  if (categories.hydration > 80) points.push("Отличные увлажняющие свойства");
  if (categories.gentleness > 80) points.push("Подходит для чувствительной кожи");
  if (breakdown.sustainabilityScore > 80) points.push("Экологичный состав");
  
  return points;
}

function identifyWeakPoints(breakdown: any, categories: any): string[] {
  const points: string[] = [];
  
  if (breakdown.allergyRisk < 60) points.push("Повышенный риск аллергических реакций");
  if (breakdown.pricePerformance < 60) points.push("Невысокое соотношение цена/качество");
  if (categories.absorption < 60) points.push("Может плохо впитываться");
  if (breakdown.sustainabilityScore < 50) points.push("Много синтетических компонентов");
  
  return points;
}