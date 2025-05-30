import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadScannerProps {
  onClose: () => void;
  onResult?: (scannedText: string, extractedIngredients?: string[], capturedImage?: string, productName?: string) => void;
}

export default function ImageUploadScanner({ onClose, onResult }: ImageUploadScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const extractIngredientsMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("/api/extract-ingredients", "POST", { text });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      // Анализ изображения через Gemini Vision
      const analysisResponse = await fetch('/api/analyze-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: selectedImage })
      });

      if (!analysisResponse.ok) {
        throw new Error('Не удалось проанализировать изображение');
      }

      const analysisData = await analysisResponse.json();
      
      if (!analysisData.ingredients || analysisData.ingredients === "NO_INGREDIENTS_FOUND") {
        toast({
          title: "Ингредиенты не найдены",
          description: "Попробуйте сделать более четкое фото упаковки с составом",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      // Извлекаем ингредиенты
      const extractedIngredients: any = await extractIngredientsMutation.mutateAsync(analysisData.ingredients);
      
      toast({
        title: "Анализ завершен!",
        description: `Найдено ${extractedIngredients.ingredients?.length || 0} ингредиентов`,
      });

      onResult?.(
        analysisData.ingredients,
        extractedIngredients.ingredients,
        selectedImage,
        analysisData.productName || "Косметический продукт"
      );
      
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Ошибка анализа",
        description: "Не удалось проанализировать изображение. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <h3 className="text-lg font-semibold">Анализ продукта</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {!selectedImage ? (
          /* File Upload */
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-medium">Загрузите фото упаковки</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Сделайте четкое фото состава на упаковке косметического средства
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button size="lg" className="gap-2">
                <Upload className="w-5 h-5" />
                Выбрать фото
              </Button>
            </label>
          </div>
        ) : (
          /* Image Preview and Analysis */
          <div className="space-y-4">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Выбранное изображение"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? "Анализирую..." : "Анализировать продукт"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setSelectedImage(null)}
                className="w-full"
              >
                Выбрать другое фото
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}