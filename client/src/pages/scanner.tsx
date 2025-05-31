import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ProductAnalyzer from "@/components/scanner/product-analyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Scan, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest("POST", "/api/products", productData);
      return response.json();
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      analyzeProductMutation.mutate({ 
        productId: product.id, 
        ingredientList: product.ingredients.join(", ")
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить продукт. Попробуйте снова.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    },
  });

  const analyzeProductMutation = useMutation({
    mutationFn: async ({ productId, ingredientList }: { productId: number; ingredientList: string }) => {
      const response = await apiRequest("POST", "/api/analysis", { productId, ingredientList });
      return response.json();
    },
    onSuccess: (analysis) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setLocation(`/analysis/${analysis.id}`);
      setIsAnalyzing(false);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось проанализировать продукт. Попробуйте снова.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = async (data: {
    productName: string;
    ingredients: string;
    productUrl?: string;
    imageData?: string;
  }) => {
    setIsAnalyzing(true);
    setShowAnalyzer(false);

    try {
      let finalIngredients = data.ingredients;
      
      // If no ingredients provided, try to find them automatically
      if (!finalIngredients.trim()) {
        const response = await apiRequest("POST", "/api/products/find-ingredients", {
          productName: data.productName.trim()
        });
        const apiData = await response.json();
        
        if (apiData.ingredients) {
          finalIngredients = apiData.ingredients;
          toast({
            title: "Состав найден автоматически",
            description: "Анализируем найденный состав продукта.",
          });
        } else {
          toast({
            title: "Состав не найден",
            description: "Попробуйте ввести состав продукта вручную.",
            variant: "destructive",
          });
          setIsAnalyzing(false);
          return;
        }
      }

      // Create product with ingredients and image
      createProductMutation.mutate({
        name: data.productName,
        category: "unknown",
        ingredients: finalIngredients.split(",").map(i => i.trim()),
        imageUrl: data.imageData,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проанализировать продукт. Попробуйте снова.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-container">
      <AppHeader />
      
      <main className="pb-20 px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">Анализ продуктов</h2>
        </div>

        {/* Main Scanner Card */}
        <Card className="border-gray-200 overflow-hidden">
          <CardContent className="p-0">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 text-white p-8 text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Умный AI-анализ</h3>
                  <p className="text-purple-100 text-sm">
                    Получите персонализированные рекомендации на основе вашего типа кожи
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-2 text-purple-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">Powered by Advanced AI</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Быстрый анализ</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setShowAnalyzer(true)}
                  className="h-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center space-y-2"
                  disabled={isAnalyzing}
                >
                  <Scan className="w-6 h-6" />
                  <span className="text-sm font-medium">Сканировать продукт</span>
                </Button>
                
                <Button
                  onClick={() => setShowAnalyzer(true)}
                  variant="outline"
                  className="h-20 border-2 border-purple-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 flex flex-col items-center justify-center space-y-2"
                  disabled={isAnalyzing}
                >
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Найти по названию</span>
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 gap-3 mt-6">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-800">Анализ совместимости с вашим типом кожи</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-800">Детальная оценка безопасности ингредиентов</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-purple-800">Персонализированные рекомендации</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Как это работает</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">1</span>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Добавьте продукт</h5>
                  <p className="text-sm text-gray-600">Сфотографируйте состав, введите название или ссылку на товар</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">2</span>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">AI анализирует</h5>
                  <p className="text-sm text-gray-600">Искусственный интеллект оценивает каждый ингредиент</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">3</span>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Получите результат</h5>
                  <p className="text-sm text-gray-600">Детальный отчет с оценкой и рекомендациями</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAnalyzing && (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                <div>
                  <h4 className="font-semibold text-purple-900">Анализируем продукт</h4>
                  <p className="text-sm text-purple-700">Это может занять несколько секунд...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
      
      {showAnalyzer && (
        <ProductAnalyzer
          onClose={() => setShowAnalyzer(false)}
          onAnalyze={handleAnalyze}
        />
      )}
    </div>
  );
}