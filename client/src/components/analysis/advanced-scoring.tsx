import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Star, 
  Heart, 
  Zap, 
  DollarSign, 
  Droplets,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Award
} from "lucide-react";

interface AdvancedScoringProps {
  scoring: any;
}

export default function AdvancedScoring({ scoring }: AdvancedScoringProps) {
  if (!scoring) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 55) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return "bg-green-100";
    if (score >= 70) return "bg-blue-100";
    if (score >= 55) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "high": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "excellent": return <Award className="w-5 h-5 text-green-600" />;
      case "good": return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "fair": return <Info className="w-5 h-5 text-yellow-600" />;
      case "poor": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Общий скор и рекомендация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Общая оценка продукта
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getRecommendationIcon(scoring.recommendation)}
              <div>
                <div className={`text-3xl font-bold ${getScoreColor(scoring.overall)}`}>
                  {scoring.overall}/100
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {scoring.recommendation === "excellent" && "Отличный выбор"}
                  {scoring.recommendation === "good" && "Хороший продукт"}
                  {scoring.recommendation === "fair" && "Средний продукт"}
                  {scoring.recommendation === "poor" && "Не рекомендуется"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className={getRiskColor(scoring.riskLevel)}>
                Риск: {scoring.riskLevel === "low" ? "низкий" : 
                       scoring.riskLevel === "medium" ? "средний" : "высокий"}
              </Badge>
              <div className="text-xs text-gray-600 mt-1">
                Уверенность: {scoring.confidenceLevel}%
              </div>
            </div>
          </div>

          {/* Основные метрики */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className={`text-lg font-semibold ${getScoreColor(scoring.safety)}`}>
                {scoring.safety}
              </div>
              <div className="text-xs text-gray-600">Безопасность</div>
            </div>
            <div className="text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className={`text-lg font-semibold ${getScoreColor(scoring.effectiveness)}`}>
                {scoring.effectiveness}
              </div>
              <div className="text-xs text-gray-600">Эффективность</div>
            </div>
            <div className="text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-pink-600" />
              <div className={`text-lg font-semibold ${getScoreColor(scoring.suitability)}`}>
                {scoring.suitability}
              </div>
              <div className="text-xs text-gray-600">Подходимость</div>
            </div>
            <div className="text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className={`text-lg font-semibold ${getScoreColor(scoring.innovation)}`}>
                {scoring.innovation}
              </div>
              <div className="text-xs text-gray-600">Инновации</div>
            </div>
            <div className="text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <div className={`text-lg font-semibold ${getScoreColor(scoring.valueForMoney)}`}>
                {scoring.valueForMoney}
              </div>
              <div className="text-xs text-gray-600">Цена/качество</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Детальные оценки */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="breakdown">Детально</TabsTrigger>
          <TabsTrigger value="advice">Советы</TabsTrigger>
          <TabsTrigger value="comparison">Сравнение</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Оценки по категориям</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span>Увлажнение</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={scoring.categories.hydration} className="w-24" />
                  <span className={`font-semibold ${getScoreColor(scoring.categories.hydration)}`}>
                    {scoring.categories.hydration}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span>Антивозрастной эффект</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={scoring.categories.antiAging} className="w-24" />
                  <span className={`font-semibold ${getScoreColor(scoring.categories.antiAging)}`}>
                    {scoring.categories.antiAging}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Защита</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={scoring.categories.protection} className="w-24" />
                  <span className={`font-semibold ${getScoreColor(scoring.categories.protection)}`}>
                    {scoring.categories.protection}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span>Мягкость</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={scoring.categories.gentleness} className="w-24" />
                  <span className={`font-semibold ${getScoreColor(scoring.categories.gentleness)}`}>
                    {scoring.categories.gentleness}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span>Впитывание</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={scoring.categories.absorption} className="w-24" />
                  <span className={`font-semibold ${getScoreColor(scoring.categories.absorption)}`}>
                    {scoring.categories.absorption}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Длительность эффекта</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={scoring.categories.longevity} className="w-24" />
                  <span className={`font-semibold ${getScoreColor(scoring.categories.longevity)}`}>
                    {scoring.categories.longevity}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Детальная разбивка оценок</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(scoring.breakdown).map(([key, value]) => {
                const labels: Record<string, string> = {
                  ingredientQuality: "Качество ингредиентов",
                  formulationBalance: "Баланс формулы",
                  skinTypeMatch: "Соответствие типу кожи",
                  allergyRisk: "Риск аллергии",
                  scientificEvidence: "Научная основа",
                  brandReputation: "Репутация бренда",
                  pricePerformance: "Соотношение цена/качество",
                  sustainabilityScore: "Экологичность"
                };
                
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{labels[key] || key}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={value as number} className="w-20" />
                      <span className={`text-sm font-semibold ${getScoreColor(value as number)}`}>
                        {value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advice" className="space-y-4">
          {/* Персонализированные советы */}
          {scoring.personalizedAdvice?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Персональные рекомендации
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scoring.personalizedAdvice.map((advice: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{advice}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Предупреждения */}
          {scoring.warnings?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Важные предупреждения
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scoring.warnings.map((warning: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Альтернативы */}
          {scoring.alternatives?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-gray-600" />
                  Альтернативные продукты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scoring.alternatives.map((alternative: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{alternative}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Сравнение с конкурентами</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {scoring.competitorComparison.betterThan}%
                </div>
                <div className="text-sm text-gray-600">
                  лучше конкурентов в категории "{scoring.competitorComparison.category}"
                </div>
              </div>

              {scoring.competitorComparison.strongPoints?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Сильные стороны:</h4>
                  <ul className="space-y-1">
                    {scoring.competitorComparison.strongPoints.map((point: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scoring.competitorComparison.weakPoints?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Области для улучшения:</h4>
                  <ul className="space-y-1">
                    {scoring.competitorComparison.weakPoints.map((point: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}