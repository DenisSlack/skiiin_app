import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ProductAnalysis from "@/components/analysis/product-analysis";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Heart, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AnalysisResult() {
  const [, params] = useRoute("/analysis-result/:id");
  const [, setLocation] = useLocation();
  const [tempData, setTempData] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const analysisId = params?.id;

  // Load temporary analysis data from sessionStorage
  useEffect(() => {
    if (analysisId === 'temp') {
      const stored = sessionStorage.getItem('tempAnalysisData');
      if (stored) {
        setTempData(JSON.parse(stored));
      }
    }
  }, [analysisId]);

  // For saved analyses, load from API
  const { data: analyses = [], isLoading: analysesLoading } = useQuery({
    queryKey: ["/api/analysis/user"],
    enabled: analysisId !== 'temp',
  });

  // Find saved analysis by ID
  const savedAnalysis = analysisId !== 'temp' && analysisId 
    ? (analyses as any[]).find((analysis: any) => analysis.id.toString() === analysisId)
    : null;

  // Get product information for saved analysis
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: [`/api/products/${savedAnalysis?.productId}`],
    enabled: !!savedAnalysis?.productId,
  });

  // Save to favorites mutation
  const saveToFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!tempData) throw new Error("No data to save");
      
      return await apiRequest("/api/products/save-favorite", "POST", {
        productData: tempData.productData,
        analysisData: {
          compatibilityScore: tempData.analysis.compatibilityScore,
          compatibilityRating: tempData.analysis.compatibilityRating,
          result: tempData.result
        }
      });
    },
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analysis/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Сохранено!",
        description: "Продукт добавлен в избранное",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить в избранное",
        variant: "destructive",
      });
    },
  });

  // Determine which data to use
  const targetAnalysis = tempData?.analysis || savedAnalysis;
  const productData = tempData?.productData || product;
  const analysisResult = tempData?.result;

  if (analysesLoading || productLoading) {
    return (
      <div className="app-container">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-gray-600">Загружаем результаты анализа...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!targetAnalysis) {
    return (
      <div className="app-container">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium text-gray-800">Анализ не найден</p>
            <p className="text-gray-600">Попробуйте проанализировать продукт еще раз</p>
            <Button 
              onClick={() => setLocation("/scanner")}
              className="bg-primary hover:bg-primary/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к сканеру
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="app-container">
      <AppHeader />
      <div className="content-area">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/scanner")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            
            {/* Show save button only for temporary analysis */}
            {tempData && !isSaved && (
              <Button 
                onClick={() => saveToFavoritesMutation.mutate()}
                disabled={saveToFavoritesMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {saveToFavoritesMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Heart className="w-4 h-4 mr-2" />
                )}
                {saveToFavoritesMutation.isPending ? "Сохранение..." : "В избранное"}
              </Button>
            )}
            
            {/* Show saved indicator */}
            {isSaved && (
              <div className="flex items-center text-green-600">
                <Save className="w-4 h-4 mr-2" />
                Сохранено
              </div>
            )}
          </div>
          
          <ProductAnalysis 
            product={productData}
            analysis={targetAnalysis}
          />
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}