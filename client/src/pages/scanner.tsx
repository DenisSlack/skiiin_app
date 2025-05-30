import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ImageUploadScanner from "@/components/scanner/image-upload-scanner";
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
  const [productImage, setProductImage] = useState<string | null>(null);
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
    if (!productName.trim()) {
      toast({
        title: "Недостающая информация",
        description: "Укажите название продукта.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      let finalIngredients = ingredients;
      
      // If no ingredients provided, try to find them automatically
      if (!ingredients.trim()) {
        const response = await apiRequest("POST", "/api/products/find-ingredients", {
          productName: productName.trim()
        });
        const data = await response.json();
        
        if (data.ingredients) {
          finalIngredients = data.ingredients;
          setIngredients(data.ingredients);
          toast({
            title: "Состав найден автоматически",
            description: "Анализируем найденный состав продукта.",
          });
        } else {
          toast({
            title: "Состав не найден",
            description: "Введите состав продукта вручную для анализа.",
            variant: "destructive",
          });
          setIsAnalyzing(false);
          return;
        }
      }

      // Create product with ingredients and image
      createProductMutation.mutate({
        name: productName,
        category: "unknown",
        ingredients: finalIngredients.split(",").map(i => i.trim()),
        imageUrl: productImage,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось найти состав продукта. Попробуйте ввести его вручную.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  const handleScanResult = (scannedText: string, extractedIngredients?: string[], capturedImage?: string, detectedProductName?: string) => {
    if (extractedIngredients && extractedIngredients.length > 0) {
      setIngredients(extractedIngredients.join(", "));
    } else {
      setIngredients(scannedText);
    }
    
    // Сохраняем захваченное изображение
    if (capturedImage) {
      setProductImage(capturedImage);
    }
    
    // Автоматически заполняем название продукта
    if (detectedProductName && !productName.trim()) {
      setProductName(detectedProductName);
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
                <ImageUploadScanner 
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
                  Запустить камеру
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Modern Product Information Form */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-0">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Информация о продукте</h3>
              <p className="text-sm text-gray-600 mt-1">Введите данные о продукте для анализа</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Product Image Preview */}
              {productImage && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <Label className="text-sm font-medium text-gray-700">
                      Фото продукта
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <img 
                      src={productImage} 
                      alt="Product"
                      className="w-16 h-16 object-cover rounded-lg border border-green-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Изображение сохранено</p>
                      <p className="text-xs text-green-600">Фото продукта будет добавлено к записи</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProductImage(null)}
                      className="text-green-600 hover:text-green-800 hover:bg-green-100"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              )}

              {/* Product Name Field */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <Label htmlFor="productName" className="text-sm font-medium text-gray-700">
                    Название продукта *
                  </Label>
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="productName"
                    placeholder="Например: La Roche-Posay Effaclar Duo"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="border-gray-300 focus:border-primary focus:ring-primary/20 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!productName.trim()) {
                        toast({
                          title: "Ошибка",
                          description: "Введите название продукта",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      try {
                        console.log("Testing ingredient search for:", productName);
                        const response = await fetch('/api/products/find-ingredients', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ productName: productName.trim() })
                        });
                        
                        console.log("Response status:", response.status);
                        
                        if (!response.ok) {
                          throw new Error(`Server error: ${response.status}`);
                        }
                        
                        const data = await response.json();
                        console.log("Response data:", data);
                        
                        if (data.ingredients) {
                          setIngredients(data.ingredients);
                          toast({
                            title: "Состав найден!",
                            description: `Найдено ${data.ingredients.split(',').length} ингредиентов`,
                          });
                        } else {
                          toast({
                            title: "Состав не найден",
                            description: "Попробуйте другое название продукта",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error("Error:", error);
                        toast({
                          title: "Ошибка поиска",
                          description: "Проверьте подключение к интернету",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={!productName.trim()}
                    className="px-4 py-2 bg-primary text-white"
                  >
                    Найти состав
                  </Button>
                </div>
              </div>

              {/* Ingredients Field */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <Label htmlFor="ingredients" className="text-sm font-medium text-gray-700">
                    Состав продукта *
                  </Label>
                </div>
                <Textarea
                  id="ingredients"
                  placeholder="Вставьте или введите список ингредиентов или просто название продукта для автоматического поиска состава..."
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={6}
                  className="resize-none border-gray-300 focus:border-primary focus:ring-primary/20"
                />
                <p className="text-xs text-gray-500">
                  Можете ввести просто название продукта - мы найдем состав автоматически
                </p>
              </div>

              {/* Analyze Button */}
              <Button 
                className="w-full app-gradient text-white font-medium h-12 text-base"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !productName.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Анализируем...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Начать анализ
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
