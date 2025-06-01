import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  User, 
  Shield, 
  Heart,
  Lightbulb,
  Target
} from "lucide-react";

interface PersonalizedCompatibilityProps {
  compatibility: any;
  userProfile?: any;
}

export default function PersonalizedCompatibility({ compatibility, userProfile }: PersonalizedCompatibilityProps) {
  if (!compatibility) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600 bg-green-100 border-green-200";
      case "medium": return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "high": return "text-red-600 bg-red-100 border-red-200";
      default: return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getRecommendationIcon = (isRecommended: boolean) => {
    return isRecommended ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 55) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      {/* Заголовок персонализированной оценки */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Персонализированная оценка совместимости
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getRecommendationIcon(compatibility.isRecommended)}
              <div>
                <div className={`text-2xl font-bold ${getCompatibilityColor(compatibility.compatibilityScore || 0)}`}>
                  {compatibility.compatibilityScore || 0}/100
                </div>
                <div className="text-sm text-gray-600">
                  {compatibility.isRecommended ? "Рекомендуется для вас" : "Не рекомендуется для вас"}
                </div>
              </div>
            </div>
            <Badge className={getRiskColor(compatibility.riskLevel)}>
              Риск: {compatibility.riskLevel === "low" ? "низкий" : 
                     compatibility.riskLevel === "medium" ? "средний" : "высокий"}
            </Badge>
          </div>
          
          <Progress 
            value={compatibility.compatibilityScore || 0} 
            className="h-3 mb-4" 
          />

          {userProfile && (
            <div className="text-xs text-gray-600 bg-white p-3 rounded-lg">
              <div className="font-medium mb-1">Ваш профиль кожи:</div>
              <div>Тип: {userProfile.skinType || "не указан"}</div>
              {userProfile.skinConcerns?.length > 0 && (
                <div>Проблемы: {userProfile.skinConcerns.join(", ")}</div>
              )}
              {userProfile.allergies?.length > 0 && (
                <div>Аллергии: {userProfile.allergies.join(", ")}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Причины подходимости/неподходимости */}
      {compatibility.suitabilityReasons?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Почему {compatibility.isRecommended ? "подходит" : "не подходит"} именно вам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {compatibility.suitabilityReasons.map((reason: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  {compatibility.isRecommended ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm">{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Конкретные проблемы для пользователя */}
      {compatibility.specificConcerns?.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Особые предупреждения для вашего типа кожи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {compatibility.specificConcerns.map((concern: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-yellow-800">{concern}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Персонализированные советы */}
      {compatibility.personalizedTips?.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Персональные рекомендации по применению
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {compatibility.personalizedTips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-green-800">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Итоговая рекомендация */}
      <Card className={compatibility.isRecommended ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {compatibility.isRecommended ? (
              <Heart className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <Shield className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div>
              <div className={`font-semibold mb-2 ${compatibility.isRecommended ? "text-green-800" : "text-red-800"}`}>
                {compatibility.isRecommended ? "✓ Продукт рекомендуется для покупки" : "⚠ Продукт не рекомендуется для покупки"}
              </div>
              <div className={`text-sm ${compatibility.isRecommended ? "text-green-700" : "text-red-700"}`}>
                Основано на анализе вашего профиля кожи и состава продукта
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}