import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Camera, RotateCcw, Check, Upload, Image } from "lucide-react";
import { startCamera, stopCamera, captureImage, resizeImage } from "@/lib/camera";
import { extractTextFromImage } from "@/lib/ocr";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface IngredientScannerProps {
  onClose: () => void;
  onResult?: (scannedText: string, extractedIngredients?: string[]) => void;
}

export default function IngredientScanner({ onClose, onResult }: IngredientScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMode, setUploadMode] = useState<'camera' | 'upload'>('camera');
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
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  }, [toast]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setIsProcessing(true);
      const imageDataUrl = captureImage(videoRef.current, canvasRef.current);
      setCapturedImage(imageDataUrl);
      
      // Stop camera
      stopCamera(videoRef.current);
      setIsScanning(false);

      // Extract text using OCR
      const text = await extractTextFromImage(imageDataUrl);
      setExtractedText(text);

      if (text.trim()) {
        // Extract ingredients using AI
        const result = await extractIngredientsMutation.mutateAsync(text);
        onResult?.(text, result.ingredients);
      } else {
        toast({
          title: "No Text Found",
          description: "Unable to detect text in the image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to process image:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [extractIngredientsMutation, onResult, toast]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setExtractedText("");
    handleStartCamera();
  }, [handleStartCamera]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        
        // Resize image for better processing
        const resizedImage = await resizeImage(imageDataUrl, 1200, 800);
        setCapturedImage(resizedImage);
        
        // Extract text using OCR
        const text = await extractTextFromImage(resizedImage);
        setExtractedText(text);

        if (text.trim()) {
          // Extract ingredients using AI
          const result = await extractIngredientsMutation.mutateAsync(text);
          onResult?.(text, result.ingredients);
        } else {
          toast({
            title: "No Text Found",
            description: "Unable to detect text in the image. Please try a clearer photo.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to process uploaded image:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [extractIngredientsMutation, onResult, toast]);

  const handleConfirm = useCallback(() => {
    if (extractedText) {
      onResult?.(extractedText);
    }
  }, [extractedText, onResult]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <h3 className="text-lg font-semibold">Scan Ingredients</h3>
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
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                  <div className="w-8 h-8 animate-spin mx-auto border-2 border-white border-t-transparent rounded-full" />
                  <p>Processing image...</p>
                </div>
              </div>
            )}
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
                Разместите список ингредиентов в рамке
              </p>
            </div>
          </div>
        ) : (
          /* Initial State - Show Options */
          <div className="h-full flex flex-col items-center justify-center space-y-6 px-6 text-white">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                {uploadMode === 'camera' ? (
                  <Camera className="w-12 h-12 text-gray-400" />
                ) : (
                  <Image className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div>
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
              Retake
            </Button>
            <Button
              className="flex-1 app-gradient text-white"
              onClick={handleConfirm}
              disabled={isProcessing || !extractedText}
            >
              <Check className="w-4 h-4 mr-2" />
              Use This
            </Button>
          </div>
        ) : (
          /* Camera/Upload Controls */
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1 max-w-xs mx-auto">
              <button
                onClick={() => setUploadMode('camera')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                  uploadMode === 'camera' 
                    ? 'bg-white text-black' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4 mr-2" />
                Камера
              </button>
              <button
                onClick={() => setUploadMode('upload')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                  uploadMode === 'upload' 
                    ? 'bg-white text-black' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Галерея
              </button>
            </div>

            {/* Action Controls */}
            <div className="flex justify-center space-x-4">
              {uploadMode === 'camera' ? (
                !isScanning ? (
                  <Button
                    className="w-16 h-16 rounded-full app-gradient text-white"
                    onClick={handleStartCamera}
                  >
                    <Camera className="w-8 h-8" />
                  </Button>
                ) : (
                  <Button
                    className="w-16 h-16 rounded-full bg-white text-black"
                    onClick={handleCapture}
                    disabled={isProcessing}
                  >
                    <div className="w-12 h-12 bg-black rounded-full"></div>
                  </Button>
                )
              ) : (
                <Button
                  className="px-6 py-3 app-gradient text-white rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {isProcessing ? 'Обработка...' : 'Выбрать фото'}
                </Button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
