import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Camera } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadScannerProps {
  onClose: () => void;
  onResult?: (scannedText: string, extractedIngredients?: string[], capturedImage?: string, productName?: string) => void;
}

export default function ImageUploadScanner({ onClose, onResult }: ImageUploadScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Не удается получить доступ к камере. Проверьте разрешения.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage(imageData);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
        {showCamera ? (
          /* Camera View */
          <div className="flex flex-col h-full">
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex space-x-4 mt-4">
              <Button
                onClick={capturePhoto}
                className="flex-1 bg-white text-black hover:bg-gray-100"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Сделать фото
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="text-white border-white hover:bg-gray-800"
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : !selectedImage ? (
          /* Choice between camera and file upload */
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-24 h-24 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center">
              <Camera className="w-12 h-12 text-teal-600" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-medium text-white">Сканировать ингредиенты</h4>
              <p className="text-gray-300">
                Наведите камеру на список ингредиентов продукта
              </p>
            </div>
            
            {cameraError && (
              <div className="bg-purple-600 text-white p-4 rounded-lg text-center max-w-sm">
                <h5 className="font-medium mb-2">Ошибка камеры</h5>
                <p className="text-sm mb-4">{cameraError}</p>
              </div>
            )}
            
            <div className="flex space-x-4">
              <Button 
                onClick={startCamera}
                size="lg" 
                className="gap-2 bg-white text-black hover:bg-gray-100"
              >
                <Camera className="w-5 h-5" />
                Камера
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button size="lg" variant="outline" className="gap-2 text-white border-white hover:bg-gray-800">
                  <Upload className="w-5 h-5" />
                  Загрузить
                </Button>
              </label>
            </div>
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