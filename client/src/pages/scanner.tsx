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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, ArrowLeft, Loader2, Link as LinkIcon, PenTool } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [showCamera, setShowCamera] = useState(false);
  const [productName, setProductName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("camera");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("/api/products", "POST", productData);
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
      return await apiRequest("/api/analysis", "POST", { productId, ingredientList });
    },
    onSuccess: (data) => {
      // Store analysis data temporarily in sessionStorage for the results page
      sessionStorage.setItem('tempAnalysisData', JSON.stringify({
        analysis: data.analysis,
        result: data.result,
        productData: {
          name: productName,
          category: "unknown",
          ingredients: ingredients.split(",").map(i => i.trim()),
          imageUrl: productImage,
        }
      }));
      setLocation(`/analysis-result/temp`);
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
        try {
          console.log("Sending request to find ingredients for:", productName.trim());
          const response = await apiRequest("/api/products/find-ingredients", "POST", {
            productName: productName.trim()
          });
          
          console.log("Received response:", response);
          
          if (response.ingredients && response.ingredients.trim().length > 0) {
            finalIngredients = response.ingredients;
            setIngredients(response.ingredients);
            console.log("Ingredients found:", response.ingredients);
            toast({
              title: "Состав найден автоматически",
              description: "Анализируем найденный состав продукта.",
            });
          } else {
            console.log("No ingredients found in response:", response);
            toast({
              title: "Состав не найден",
              description: "Введите состав продукта вручную для анализа.",
              variant: "destructive",
            });
            setIsAnalyzing(false);
            return;
          }
        } catch (error) {
          console.error("Error finding ingredients:", error);
          toast({
            title: "Не удалось найти состав продукта",
            description: "Попробуйте ввести его вручную.",
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

  const handleAnalyzeByUrl = async () => {
    console.log('handleAnalyzeByUrl called with URL:', productUrl);
    
    if (!productUrl.trim()) {
      console.log('No URL provided');
      toast({
        title: "Ошибка",
        description: "Введите ссылку на товар",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting URL analysis...');
    setIsAnalyzing(true);

    try {
      const response = await apiRequest("POST", "/api/products/analyze-url", {
        url: productUrl
      });
      const result = await response.json();
      
      if (result.ingredients && result.productName) {
        setProductName(result.productName);
        setIngredients(result.ingredients);
        if (result.imageUrl) {
          setProductImage(result.imageUrl);
        }
        
        toast({
          title: "Состав извлечен",
          description: "Анализируем состав продукта с сайта.",
        });
        
        // Create product with extracted data
        createProductMutation.mutate({
          name: result.productName,
          category: "unknown",
          ingredients: result.ingredients.split(",").map((i: string) => i.trim()),
          imageUrl: result.imageUrl,
        });
      } else {
        toast({
          title: "Состав не найден",
          description: "Не удалось извлечь состав продукта со страницы. Попробуйте другую ссылку.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проанализировать страницу товара. Проверьте ссылку.",
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

        {/* Analysis Methods Tabs */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="camera" className="flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Камера</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4" />
                  <span>Ссылка</span>
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center space-x-2">
                  <PenTool className="w-4 h-4" />
                  <span>Вручную</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera" className="mt-6">
                {showCamera ? (
                  <div className="space-y-4">
                    <ImageUploadScanner 
                      onClose={() => setShowCamera(false)}
                      onResult={handleScanResult}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-gray-100 rounded-xl h-48 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-gray-600 text-sm">Сканируйте состав продукта</p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full app-gradient text-white font-medium"
                      onClick={() => setShowCamera(true)}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Запустить камеру
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="mt-6">
                <div className="space-y-4">
                  <div className="relative bg-blue-50 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
                      <LinkIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Анализ по ссылке</h3>
                    <p className="text-gray-600 text-sm">Вставьте ссылку на товар из интернет-магазина</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="productUrl" className="text-sm font-medium text-gray-700">
                      Ссылка на товар
                    </Label>
                    <Input
                      id="productUrl"
                      type="url"
                      placeholder="https://example.com/product/..."
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <Button 
                    className="w-full app-gradient text-white font-medium"
                    onClick={handleAnalyzeByUrl}
                    disabled={isAnalyzing || !productUrl.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Анализируем страницу...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Анализировать по ссылке
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-6">
                <div className="space-y-6">
                  <div className="relative bg-green-50 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto flex items-center justify-center mb-4">
                      <PenTool className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Ручной ввод</h3>
                    <p className="text-gray-600 text-sm">Введите название и состав продукта самостоятельно</p>
                  </div>

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
                    <Label htmlFor="productName" className="text-sm font-medium text-gray-700">
                      Название продукта *
                    </Label>
                    <Input
                      id="productName"
                      placeholder="Например: La Roche-Posay Effaclar Duo"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="border-gray-300 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  {/* Ingredients Field */}
                  <div className="space-y-3">
                    <Label htmlFor="ingredients" className="text-sm font-medium text-gray-700">
                      Состав продукта *
                    </Label>
                    <Textarea
                      id="ingredients"
                      placeholder="Введите список ингредиентов или просто название продукта для автоматического поиска состава..."
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      rows={6}
                      className="resize-none border-gray-300 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <Button 
                    className="w-full app-gradient text-white font-medium"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !productName.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Анализируем...
                      </>
                    ) : (
                      "Анализировать продукт"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>


      </main>

      <BottomNavigation />
    </div>
  );
}
