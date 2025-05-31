import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Search, Upload, Link, Scan, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("camera");
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
        ingredientList: product.ingredients.join(", ")
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать продукт",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    },
  });

  const analyzeProductMutation = useMutation({
    mutationFn: async (data: { productId: number; ingredientList: string }) => {
      return await apiRequest("/api/analyses", "POST", data);
    },
    onSuccess: (analysis) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      setLocation(`/analysis/${analysis.id}`);
      setIsAnalyzing(false);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось проанализировать продукт",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = async () => {
    if (!productName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название продукта",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      let finalIngredients = ingredients;
      
      if (!finalIngredients.trim()) {
        const response = await apiRequest("/api/products/find-ingredients", "POST", {
          productName: productName.trim()
        });
        
        if (response.ingredients) {
          finalIngredients = response.ingredients;
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

      createProductMutation.mutate({
        name: productName,
        ingredients: finalIngredients.split(',').map(ing => ing.trim()),
        productUrl: productUrl || undefined,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при анализе",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-container">
      <AppHeader />
      <div className="content-area pb-20 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center space-y-2 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Scan className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Анализ продукта
                </h1>
                <p className="text-gray-600 text-sm">
                  Выберите способ анализа косметического средства
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="camera" className="flex flex-col items-center gap-1 py-3">
                    <Camera className="h-4 w-4" />
                    <span className="text-xs">Камера</span>
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex flex-col items-center gap-1 py-3">
                    <Upload className="h-4 w-4" />
                    <span className="text-xs">Фото</span>
                  </TabsTrigger>
                  <TabsTrigger value="search" className="flex flex-col items-center gap-1 py-3">
                    <Search className="h-4 w-4" />
                    <span className="text-xs">Поиск</span>
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex flex-col items-center gap-1 py-3">
                    <Link className="h-4 w-4" />
                    <span className="text-xs">URL</span>
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Название продукта</label>
                    <Input
                      placeholder="Введите название продукта"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="mb-4"
                    />
                  </div>

                  <TabsContent value="camera" className="mt-0 space-y-4">
                    <Card className="border-dashed border-2 border-gray-300">
                      <CardContent className="p-8 text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Функция камеры в разработке</p>
                        <Button variant="outline" disabled>
                          <Camera className="mr-2 h-4 w-4" />
                          Сканировать камерой
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-0 space-y-4">
                    <Card className="border-dashed border-2 border-gray-300">
                      <CardContent className="p-8 text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Загрузите фото состава продукта</p>
                        <Button variant="outline" disabled>
                          <Upload className="mr-2 h-4 w-4" />
                          Выбрать файл
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="search" className="mt-0 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Состав (опционально)</label>
                      <Textarea
                        placeholder="Введите состав продукта или оставьте пустым для автоматического поиска"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="mt-0 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">URL продукта</label>
                      <Input
                        placeholder="https://example.com/product"
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                        className="mb-4"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Состав (опционально)</label>
                      <Textarea
                        placeholder="Введите состав продукта или оставьте пустым для автоматического поиска"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !productName.trim()}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Анализируем...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Анализировать продукт
                    </>
                  )}
                </Button>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}