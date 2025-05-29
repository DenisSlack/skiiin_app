import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Camera, RotateCcw, Check } from "lucide-react";
import { startCamera, stopCamera, captureImage } from "@/lib/camera";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
        ) : (
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
                Position ingredient list within the frame
              </p>
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
          /* Camera Controls */
          <div className="flex justify-center space-x-4">
            {!isScanning ? (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
