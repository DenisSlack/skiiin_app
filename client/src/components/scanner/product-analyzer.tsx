import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Search, Upload, Link, Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProductAnalyzerProps {
  onClose: () => void;
  onAnalyze: (data: {
    productName: string;
    ingredients: string;
    productUrl?: string;
    imageData?: string;
  }) => void;
}

export default function ProductAnalyzer({ onClose, onAnalyze }: ProductAnalyzerProps) {
  const [activeTab, setActiveTab] = useState("search");
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Поиск ингредиентов по названию
  const searchIngredients = useCallback(async () => {
    if (!productName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название продукта",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/products/find-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productName: productName.trim() })
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      if (data.ingredients) {
        setIngredients(data.ingredients);
        toast({
          title: "Состав найден!",
          description: `Найдено ${data.ingredients.split(',').length} ингредиентов`,
        });
      } else {
        toast({
          title: "Состав не найден",
          description: "Попробуйте другой способ добавления",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка поиска",
        description: "Проверьте подключение к интернету",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [productName, toast]);

  // Анализ URL товара
  const analyzeUrl = useCallback(async () => {
    if (!productUrl.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ссылку на товар",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      // Здесь можно добавить API для парсинга URL и извлечения информации о продукте
      toast({
        title: "Анализ ссылки",
        description: "Функция будет добавлена в следующих обновлениях",
      });
    } catch (error) {
      toast({
        title: "Ошибка анализа",
        description: "Не удалось проанализировать ссылку",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [productUrl, toast]);

  // Запуск камеры
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Ошибка камеры",
        description: "Не удается получить доступ к камере",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Захват изображения
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context?.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    
    // Остановить камеру
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  }, []);

  // Загрузка файла
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
    };
    reader.readAsDataURL(file);
  }, []);

  // Анализ продукта
  const handleAnalyze = useCallback(() => {
    if (!productName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название продукта",
        variant: "destructive",
      });
      return;
    }

    onAnalyze({
      productName: productName.trim(),
      ingredients: ingredients.trim(),
      productUrl: productUrl.trim() || undefined,
      imageData: capturedImage || undefined,
    });
  }, [productName, ingredients, productUrl, capturedImage, onAnalyze, toast]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Анализ косметического продукта</h2>
          <p className="text-purple-100 text-sm">Выберите способ добавления информации о продукте</p>
        </div>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="search" className="text-xs">
                <Search className="w-4 h-4 mb-1" />
                Поиск
              </TabsTrigger>
              <TabsTrigger value="camera" className="text-xs">
                <Camera className="w-4 h-4 mb-1" />
                Камера
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs">
                <Upload className="w-4 h-4 mb-1" />
                Фото
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs">
                <Link className="w-4 h-4 mb-1" />
                Ссылка
              </TabsTrigger>
            </TabsList>

            {/* Поиск по названию */}
            <TabsContent value="search" className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="Название продукта"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="border-gray-300"
                />
                <Button
                  onClick={searchIngredients}
                  disabled={isProcessing || !productName.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  {isProcessing ? "Поиск..." : "Найти состав"}
                </Button>
              </div>
            </TabsContent>

            {/* Камера */}
            <TabsContent value="camera" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {!capturedImage ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-48 object-cover rounded-lg bg-gray-100 hidden"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Камера будет здесь</p>
                    <Button
                      onClick={startCamera}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      Открыть камеру
                    </Button>
                  </>
                ) : (
                  <>
                    <img src={capturedImage} alt="Captured" className="w-full h-48 object-cover rounded-lg mb-4" />
                    <Button
                      onClick={() => setCapturedImage(null)}
                      variant="outline"
                      className="mr-2"
                    >
                      Переснять
                    </Button>
                  </>
                )}
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Scan className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    Наведите камеру на список ингредиентов на упаковке
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Загрузка фото */}
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {!capturedImage ? (
                  <>
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Загрузите фото состава</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      Выбрать фото
                    </Button>
                  </>
                ) : (
                  <>
                    <img src={capturedImage} alt="Uploaded" className="w-full h-48 object-cover rounded-lg mb-4" />
                    <Button
                      onClick={() => setCapturedImage(null)}
                      variant="outline"
                    >
                      Выбрать другое фото
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Ссылка на товар */}
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="https://example.com/product"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="border-gray-300"
                />
                <Button
                  onClick={analyzeUrl}
                  disabled={isProcessing || !productUrl.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  {isProcessing ? "Анализ..." : "Анализировать ссылку"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Поля для ручного ввода */}
          <div className="space-y-4 mt-6">
            <Input
              placeholder="Название продукта"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="border-gray-300"
            />
            <Textarea
              placeholder="Список ингредиентов (необязательно)"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={4}
              className="border-gray-300 resize-none"
            />
          </div>

          {/* Кнопки действий */}
          <div className="flex space-x-3 mt-6">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={!productName.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              Проанализировать продукт
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}