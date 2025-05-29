import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Zap, Heart, TrendingUp, DollarSign, Award, Info } from "lucide-react";

interface ProductScore {
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

interface ProductScoringProps {
  scoring: ProductScore;
}

export default function ProductScoring({ scoring }: ProductScoringProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 85) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 55) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "excellent": return <Award className="w-4 h-4 text-green-600" />;
      case "good": return <Star className="w-4 h-4 text-blue-600" />;
      case "fair": return <Info className="w-4 h-4 text-yellow-600" />;
      case "poor": return <Shield className="w-4 h-4 text-red-600" />;
      default: return <Star className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case "excellent": return "Отличный выбор";
      case "good": return "Хороший продукт";
      case "fair": return "Приемлемое качество";
      case "poor": return "Требует осторожности";
      default: return "Оценивается";
    }
  };

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Оценка продукта</h4>
          <div className="flex items-center space-x-2">
            {getRecommendationIcon(scoring.recommendation)}
            <span className="text-sm font-medium">
              {getRecommendationText(scoring.recommendation)}
            </span>
          </div>
        </div>

        {/* Overall Score */}
        <div className={`p-4 rounded-xl border ${getScoreColor(scoring.overall)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Общая оценка</span>
            <span className="text-2xl font-bold">{scoring.overall}/100</span>
          </div>
          <Progress value={scoring.overall} className="h-2" />
          <div className="mt-2 text-xs opacity-75">
            Уверенность в оценке: {scoring.confidenceLevel}%
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Безопасность</span>
            </div>
            <div className="flex items-center justify-between">
              <Progress value={scoring.safety} className="flex-1 h-1" />
              <span className="text-sm font-bold ml-2">{scoring.safety}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Эффективность</span>
            </div>
            <div className="flex items-center justify-between">
              <Progress value={scoring.effectiveness} className="flex-1 h-1" />
              <span className="text-sm font-bold ml-2">{scoring.effectiveness}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Подходимость</span>
            </div>
            <div className="flex items-center justify-between">
              <Progress value={scoring.suitability} className="flex-1 h-1" />
              <span className="text-sm font-bold ml-2">{scoring.suitability}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Цена/качество</span>
            </div>
            <div className="flex items-center justify-between">
              <Progress value={scoring.valueForMoney} className="flex-1 h-1" />
              <span className="text-sm font-bold ml-2">{scoring.valueForMoney}</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700">Детальная разбивка</h5>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Качество ингредиентов</span>
              <Badge variant="secondary" className={getScoreColor(scoring.breakdown.ingredientQuality)}>
                {scoring.breakdown.ingredientQuality}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Баланс формулы</span>
              <Badge variant="secondary" className={getScoreColor(scoring.breakdown.formulationBalance)}>
                {scoring.breakdown.formulationBalance}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Соответствие типу кожи</span>
              <Badge variant="secondary" className={getScoreColor(scoring.breakdown.skinTypeMatch)}>
                {scoring.breakdown.skinTypeMatch}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Низкий риск аллергии</span>
              <Badge variant="secondary" className={getScoreColor(scoring.breakdown.allergyRisk)}>
                {scoring.breakdown.allergyRisk}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Научная поддержка</span>
              <Badge variant="secondary" className={getScoreColor(scoring.breakdown.scientificEvidence)}>
                {scoring.breakdown.scientificEvidence}
              </Badge>
            </div>
          </div>
        </div>

        {/* Innovation Score */}
        {scoring.innovation > 60 && (
          <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">Инновационность</p>
              <p className="text-xs text-orange-600">
                Продукт содержит современные ингредиенты ({scoring.innovation}/100)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}