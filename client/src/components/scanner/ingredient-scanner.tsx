import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Camera, RotateCcw, Check, Upload, Search } from "lucide-react";
import { startCamera, stopCamera, captureImage, resizeImage } from "@/lib/camera";
import { extractTextFromImage } from "@/lib/ocr";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface IngredientScannerProps {
  onClose: () => void;
  onResult?: (scannedText: string, extractedIngredients?: string[], capturedImage?: string, productName?: string) => void;
}

export default function IngredientScanner({ onClose, onResult }: IngredientScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMode, setUploadMode] = useState<'camera' | 'upload' | 'search'>('camera');
  const [productName, setProductName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const extractIngredientsMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/extract-ingredients", { text });
      return response.json();
    },
  });

  const handleStartCamera = useCallback(async () => {
    try {
      setIsScanning(true);
      await startCamera(videoRef.current!);
    } catch (error) {
      console.error("Failed to start camera:", error);
      toast({
        title: "Ошибка камеры",
        description: "Не удается получить доступ к камере. Проверьте разрешения.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  }, [toast]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const imageDataUrl = captureImage(videoRef.current, canvasRef.current);
      setCapturedImage(imageDataUrl);
      
      // Stop camera
      stopCamera(videoRef.current);
      setIsScanning(false);
    } catch (error) {
      console.error("Failed to capture image:", error);
      toast({
        title: "Ошибка камеры",
        description: "Не удалось сделать снимок. Попробуйте еще раз.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setExtractedText("");
    setIsProcessing(false);
    handleStartCamera();
  }, [handleStartCamera]);

  const handleConfirm = useCallback(async () => {
    console.log("handleConfirm called");
    if (!capturedImage) {
      console.log("No captured image, returning");
      return;
    }

    try {
      console.log("Setting isProcessing to true");
      setIsProcessing(true);

      // Try OCR with Gemini Vision API
      let text = extractedText;
      if (!text && capturedImage) {
        console.log("Attempting Gemini OCR extraction...");
        try {
          const ocrResponse = await fetch('/api/extract-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData: capturedImage })
          });
          
          if (ocrResponse.ok) {
            const ocrData = await ocrResponse.json();
            if (ocrData.text && ocrData.text !== "NO_INGREDIENTS_FOUND" && ocrData.text !== "MANUAL_INPUT_REQUIRED" && ocrData.text.trim()) {
              text = ocrData.text;
              setExtractedText(text);
              console.log("OCR successful, text length:", text.length);
              toast({
                title: "Текст распознан!",
                description: "Проверьте и отредактируйте если нужно",
              });
            } else {
              console.log("OCR requires manual input");
              toast({
                title: "Введите состав вручную",
                description: "Посмотрите на фото и введите ингредиенты в поле ниже",
              });
              setIsProcessing(false);
              return;
            }
          } else {
            throw new Error('OCR request failed');
          }
        } catch (ocrError) {
          console.error("Gemini OCR failed:", ocrError);
          toast({
            title: "Введите состав вручную",
            description: "Автоматическое распознавание не удалось",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
      }

      if (!text.trim()) {
        toast({
          title: "Введите состав",
          description: "Пожалуйста, введите список ингредиентов в текстовое поле",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log("Processing ingredients with text length:", text.length);
      
      // Extract ingredients using AI
      const result = await extractIngredientsMutation.mutateAsync(text);
      console.log("AI extraction completed");
      
      // Try to extract product name from the text
      let productName = "Косметический продукт";
      try {
        const productNameResponse = await fetch('/api/extract-product-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        
        if (productNameResponse.ok) {
          const nameData = await productNameResponse.json();
          if (nameData.productName && nameData.productName.trim()) {
            productName = nameData.productName;
          }
        }
      } catch (nameError) {
        console.warn("Failed to extract product name:", nameError);
      }
      
      onResult?.(text, result.ingredients, capturedImage, productName);
    } catch (error) {
      console.error("Failed to process image:", error);
      toast({
        title: "Ошибка обработки",
        description: "Не удалось обработать изображение. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, extractedText, extractIngredientsMutation, onResult, toast]);

  const handleProductSearch = useCallback(async () => {
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
      
      const response = await fetch('/api/find-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to find ingredients');
      }

      const data = await response.json();
      
      if (data.suggestScanning || !data.ingredients) {
        toast({
          title: "Состав не найден",
          description: data.message || "Попробуйте отсканировать ингредиенты с упаковки",
          variant: "destructive",
        });
        return;
      }

      const result = await extractIngredientsMutation.mutateAsync(data.ingredients);
      onResult?.(data.ingredients, result.ingredients, undefined, productName.trim());
    } catch (error) {
      console.error("Error searching product:", error);
      toast({
        title: "Ошибка поиска",
        description: "Не удалось найти состав продукта. Попробуйте сканирование.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [productName, extractIngredientsMutation, onResult, toast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Неверный формат",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        const resizedImage = await resizeImage(imageDataUrl);
        setCapturedImage(resizedImage);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить изображение",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [toast]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <h3 className="text-lg font-semibold">Сканировать состав</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera/Image View */}
      <div className="flex-1 relative">
        {capturedImage ? (
          /* Captured Image Preview */
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="max-w-full max-h-full object-contain"
            />
            {/* Manual input overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 p-4 space-y-3">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">
                  {extractedText ? "Состав распознан автоматически (можно редактировать):" : "Введите состав с упаковки:"}
                </label>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  placeholder="Перечислите ингредиенты через запятую..."
                  className="w-full h-24 px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-primary focus:outline-none text-sm resize-none"
                />
              </div>
            </div>
          </div>
        ) : isScanning ? (
          /* Camera View */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <div className="border-2 border-primary rounded-lg w-3/4 h-3/4 relative">
                <div className="absolute top-0 left-0 border-l-4 border-t-4 border-primary w-6 h-6"></div>
                <div className="absolute top-0 right-0 border-r-4 border-t-4 border-primary w-6 h-6"></div>
                <div className="absolute bottom-0 left-0 border-l-4 border-b-4 border-primary w-6 h-6"></div>
                <div className="absolute bottom-0 right-0 border-r-4 border-b-4 border-primary w-6 h-6"></div>
                <div className="scan-line absolute w-full h-1 animate-scan"></div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute top-4 left-4 right-4 text-center">
              <p className="text-white text-sm bg-black bg-opacity-50 rounded px-3 py-2">
                Наведите камеру на список ингредиентов
              </p>
            </div>
          </div>
        ) : (
          /* Upload/Search Interface */
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center text-white space-y-6 max-w-md">
              {uploadMode === 'search' ? (
                /* Search Mode */
                <div className="space-y-4">
                  <Search className="w-16 h-16 mx-auto text-primary" />
                  <h3 className="text-lg font-semibold">Поиск по названию</h3>
                  <p className="text-gray-300 text-sm">
                    Введите название продукта для автоматического поиска состава
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Название продукта..."
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-primary focus:outline-none"
                      disabled={isProcessing}
                    />
                    <Button
                      onClick={handleProductSearch}
                      disabled={isProcessing || !productName.trim()}
                      className="w-full app-gradient text-white"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                          Поиск...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Найти состав
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Camera/Upload Mode Instructions */
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 text-primary">
                    {uploadMode === 'camera' ? <Camera /> : <Upload />}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {uploadMode === 'camera' ? 'Сканировать ингредиенты' : 'Загрузить фото продукта'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {uploadMode === 'camera' 
                      ? 'Наведите камеру на список ингредиентов продукта'
                      : 'Выберите фото из галереи со списком ингредиентов'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-4 bg-black">
        {capturedImage ? (
          /* Capture Controls */
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRetake}
              disabled={isProcessing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Повторить
            </Button>
            <Button
              className="flex-1 app-gradient text-white"
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Обработка...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Использовать
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Camera/Upload Controls */
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1 max-w-md mx-auto">
              <button
                onClick={() => setUploadMode('camera')}
                className={`flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
                  uploadMode === 'camera' 
                    ? 'bg-white text-black' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4 mr-1" />
                Камера
              </button>
              <button
                onClick={() => setUploadMode('upload')}
                className={`flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
                  uploadMode === 'upload' 
                    ? 'bg-white text-black' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4 mr-1" />
                Загрузить
              </button>
              <button
                onClick={() => setUploadMode('search')}
                className={`flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
                  uploadMode === 'search' 
                    ? 'bg-white text-black' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4 mr-1" />
                Поиск
              </button>
            </div>

            {/* Action Button */}
            {uploadMode === 'camera' && (
              <Button
                onClick={handleStartCamera}
                disabled={isScanning || isProcessing}
                className="w-full app-gradient text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isScanning ? 'Камера активна' : 'Включить камеру'}
              </Button>
            )}

            {uploadMode === 'upload' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full app-gradient text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Выбрать фото
                </Button>
              </>
            )}

            {/* Capture Button - shown when camera is active */}
            {isScanning && (
              <Button
                onClick={handleCapture}
                className="w-full app-gradient text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Сфотографировать
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}