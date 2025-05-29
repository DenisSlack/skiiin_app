import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Share2, CheckCircle, Info, Star, AlertTriangle, Microscope, TrendingUp, User, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProductAnalysisProps {
  product: any;
  analysis?: any;
}

export default function ProductAnalysis({ product, analysis }: ProductAnalysisProps) {
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [personalRecommendation, setPersonalRecommendation] = useState<string>("");
  const [userReviews, setUserReviews] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Получаем профиль пользователя
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Мутация для получения персональной рекомендации
  const getPersonalRecommendation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/analysis/personal-recommendation", {
        method: "POST",
        body: {
          productName: product.name,
          ingredients: product.ingredients || "",
          skinProfile: {
            skinType: user?.skinType || "",
            skinConcerns: user?.skinConcerns || [],
            allergies: user?.allergies || [],
            preferences: user?.preferences || []
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setPersonalRecommendation(data.recommendation);
    }
  });

  // Мутация для получения отзывов пользователей
  const getUserReviews = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/analysis/user-reviews", {
        method: "POST",
        body: {
          productName: product.name
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setUserReviews(data.reviews || []);
    }
  });

  const getCompatibilityColor = (rating: string) => {
    switch (rating) {
      case "excellent": return "text-green-600 bg-green-50";
      case "good": return "text-blue-600 bg-blue-50";
      case "caution": return "text-yellow-600 bg-yellow-50";
      case "avoid": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getCompatibilityIcon = (rating: string) => {
    switch (rating) {
      case "excellent": return <CheckCircle className="w-4 h-4" />;
      case "good": return <Star className="w-4 h-4" />;
      case "caution": return <Info className="w-4 h-4" />;
      case "avoid": return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getIngredientSafetyColor = (rating: string) => {
    switch (rating) {
      case "safe": return "bg-green-500";
      case "caution": return "bg-yellow-500";
      case "avoid": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${product.name} Analysis`,
        text: `Check out my Skiiin IQ analysis for ${product.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Analysis link copied to clipboard",
      });
    }
  };

  const compatibilityScore = product.compatibilityScore || 0;
  const compatibilityRating = product.compatibilityRating || "unknown";
  const ingredients = product.ingredients || [];
  const insights = analysis?.insights || {};
  const researchSummary = analysis?.result?.researchSummary;
  const alternativeProducts = analysis?.result?.alternativeProducts || [];
  const marketTrends = insights?.marketTrends || [];
  const expertAdvice = insights?.expertAdvice || [];

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <Card className="border-gray-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-center text-xs">No Image</div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              {product.brand && (
                <p className="text-gray-600 text-sm">{product.brand}</p>
              )}
              <div className="mt-2 flex items-center space-x-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(compatibilityRating)}`}>
                  {getCompatibilityIcon(compatibilityRating)}
                  <span>{compatibilityScore}% Compatible</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Compatibility Score */}
          <div className={`p-4 rounded-xl ${getCompatibilityColor(compatibilityRating)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Compatibility Score</span>
              <span className="text-lg font-bold capitalize">{compatibilityRating} Match</span>
            </div>
            <Progress value={compatibilityScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      {insights && (insights.positive?.length > 0 || insights.concerns?.length > 0) && (
        <Card className="border-gray-200">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-semibold">Key Insights</h4>
            
            <div className="space-y-3">
              {insights.positive?.map((insight: string, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                  <p className="text-sm text-green-800">{insight}</p>
                </div>
              ))}
              
              {insights.concerns?.map((concern: string, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" size={16} />
                  <p className="text-sm text-yellow-800">{concern}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Analysis Tabs */}
      {ingredients.length > 0 && (
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <Tabs defaultValue="ingredients" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="ingredients" className="text-xs">Ingredients</TabsTrigger>
                <TabsTrigger value="research" className="text-xs">Research</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                <TabsTrigger value="expert" className="text-xs">Expert</TabsTrigger>
              </TabsList>

              <TabsContent value="ingredients" className="space-y-3">
                <div className="flex items-center space-x-2 mb-4">
                  <Microscope className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Ingredient Analysis</h4>
                </div>
                
                {/* Список ингредиентов для отображения */}
                {(showAllIngredients ? ingredients : ingredients.slice(0, 10)).map((ingredient: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {typeof ingredient === 'string' ? ingredient : ingredient.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getIngredientSafetyColor(ingredient.safetyRating || 'safe')}`}></div>
                        <span className="text-xs font-medium text-gray-600 capitalize">
                          {ingredient.safetyRating || 'Safe'}
                        </span>
                      </div>
                    </div>
                    
                    {ingredient.purpose && (
                      <p className="text-xs text-gray-600">{ingredient.purpose}</p>
                    )}
                    
                    {ingredient.scientificResearch && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Research:</strong> {ingredient.scientificResearch.slice(0, 120)}...
                      </div>
                    )}
                    
                    {ingredient.expertOpinion && (
                      <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                        <strong>Expert Opinion:</strong> {ingredient.expertOpinion.slice(0, 120)}...
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Кнопка для раскрытия/скрытия полного состава */}
                {ingredients.length > 10 && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-500 hover:text-primary"
                      onClick={() => setShowAllIngredients(!showAllIngredients)}
                    >
                      {showAllIngredients ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Hide ingredients
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          And {ingredients.length - 10} more ingredients...
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="research" className="space-y-3">
                <div className="flex items-center space-x-2 mb-4">
                  <Microscope className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Research & Reviews</h4>
                </div>
                
                {/* Научные исследования */}
                {researchSummary ? (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Scientific Research</h5>
                    <p className="text-sm text-blue-800">{researchSummary}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Research summary not available for this analysis.</p>
                )}

                {/* Отзывы пользователей */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium">User Reviews from Internet</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => getUserReviews.mutate()}
                      disabled={getUserReviews.isPending}
                    >
                      {getUserReviews.isPending ? "Loading..." : "Load Reviews"}
                    </Button>
                  </div>
                  
                  {userReviews.length > 0 ? (
                    <div className="space-y-2">
                      {userReviews.map((review: string, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-3 border-purple-400">
                          <p className="text-xs text-gray-700">{review}</p>
                        </div>
                      ))}
                    </div>
                  ) : userReviews.length === 0 && !getUserReviews.isPending ? (
                    <p className="text-xs text-gray-500">Click "Load Reviews" to see user reviews from the internet</p>
                  ) : null}
                </div>
                
                {/* Альтернативные продукты */}
                {alternativeProducts.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Alternative Products</h5>
                    <div className="space-y-1">
                      {alternativeProducts.slice(0, 3).map((alt: string, index: number) => (
                        <div key={index} className="text-xs p-2 bg-green-50 rounded border-l-2 border-green-400">
                          {alt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trends" className="space-y-3">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Market Trends</h4>
                </div>
                
                {marketTrends.length > 0 ? (
                  <div className="space-y-2">
                    {marketTrends.map((trend: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                        <TrendingUp className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-orange-800">{trend}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Market trend data not available for this analysis.</p>
                )}
              </TabsContent>

              <TabsContent value="expert" className="space-y-3">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Expert Advice</h4>
                </div>
                
                {expertAdvice.length > 0 ? (
                  <div className="space-y-2">
                    {expertAdvice.map((advice: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-purple-50 rounded-lg">
                        <User className="w-3 h-3 text-purple-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-purple-800">{advice}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Expert advice not available for this analysis.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="border-gray-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Personal Recommendations</h4>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => getPersonalRecommendation.mutate()}
              disabled={getPersonalRecommendation.isPending}
            >
              {getPersonalRecommendation.isPending ? "Loading..." : "Get Personal Advice"}
            </Button>
          </div>
          
          {/* Персональная рекомендация */}
          {personalRecommendation && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-400">
              <h5 className="text-sm font-medium text-purple-800 mb-2">For Your Skin Type</h5>
              <p className="text-sm text-purple-700">{personalRecommendation}</p>
            </div>
          )}
          
          {/* Общие рекомендации */}
          {insights?.recommendations?.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">General Recommendations</h5>
              {insights.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          )}
          
          {!personalRecommendation && !insights?.recommendations?.length && (
            <p className="text-sm text-gray-500">Click "Get Personal Advice" to receive personalized recommendations based on your skin profile.</p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="px-6"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          className="flex-1 app-gradient text-white font-medium"
          onClick={() => {
            toast({
              title: "Saved",
              description: "Product saved to your library",
            });
          }}
        >
          <Save className="w-4 h-4 mr-2" />
          Save to Library
        </Button>
      </div>
    </div>
  );
}
