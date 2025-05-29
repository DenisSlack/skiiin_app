import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import IngredientScanner from "@/components/scanner/ingredient-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera, ArrowLeft, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [showCamera, setShowCamera] = useState(false);
  const [productName, setProductName] = useState("");
  const [ingredients, setIngredients] = useState("");
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
        ingredientList: ingredients 
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setLocation(`/analysis/${data.analysis.productId}`);
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

  const handleAnalyze = async () => {
    if (!productName.trim() || !ingredients.trim()) {
      toast({
        title: "Недостающая информация",
        description: "Укажите название продукта и состав.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    // Create product first
    createProductMutation.mutate({
      name: productName,
      category: "unknown",
      ingredients: ingredients.split(",").map(i => i.trim()),
    });
  };

  const handleScanResult = (scannedText: string, extractedIngredients?: string[]) => {
    if (extractedIngredients && extractedIngredients.length > 0) {
      setIngredients(extractedIngredients.join(", "));
    } else {
      setIngredients(scannedText);
    }
    setShowCamera(false);
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
          <h2 className="text-xl font-semibold">Сканер продуктов</h2>
        </div>

        {/* Scanner Section */}
        <Card className="border-gray-200">
          <CardContent className="p-6 space-y-4">
            {showCamera ? (
              <div className="space-y-4">
                <IngredientScanner 
                  onClose={() => setShowCamera(false)}
                  onResult={handleScanResult}
                />
              </div>
            ) : (
              <>
                <div className="relative bg-gray-100 rounded-xl h-48 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-600 text-sm">Нажмите для сканирования состава</p>
                  </div>
                </div>
                
                <Button 
                  className="w-full app-gradient text-white font-medium"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Manual Input Form */}
        <Card className="border-gray-200">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Product Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  placeholder="e.g., CeraVe Daily Moisturizer"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., CeraVe"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients *</Label>
                <Textarea
                  id="ingredients"
                  placeholder="Enter or paste ingredient list here..."
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>

            <Button 
              className="w-full app-gradient text-white font-medium"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !productName.trim() || !ingredients.trim()}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Product"
              )}
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
