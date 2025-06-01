import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ProductAnalysis from "@/components/analysis/product-analysis";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AnalysisResult() {
  const [, params] = useRoute("/analysis-result/:id");
  const [, setLocation] = useLocation();
  const analysisId = params?.id;

  const { data: analyses = [], isLoading: analysesLoading } = useQuery({
    queryKey: ["/api/analysis/user"],
  });

  // Find the analysis by ID or get the latest one
  const targetAnalysis = analysisId 
    ? (analyses as any[]).find((analysis: any) => analysis.id.toString() === analysisId)
    : (analyses as any[])[0]; // Get the latest analysis if no specific ID

  // Get product information if we have an analysis
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: [`/api/products/${targetAnalysis?.productId}`],
    enabled: !!targetAnalysis?.productId,
  });

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
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/scanner")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          
          <ProductAnalysis 
            product={product}
            analysis={targetAnalysis}
          />
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}