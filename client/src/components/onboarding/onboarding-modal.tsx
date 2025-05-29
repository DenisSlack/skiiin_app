import { FlaskConical, Camera, UserCheck, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartProfile: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onStartProfile }: OnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-slide-up">
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto flex items-center justify-center">
              <FlaskConical className="text-white text-2xl" />
            </div>
            <h3 className="text-xl font-bold">Welcome to Skiiin IQ</h3>
            <p className="text-gray-600 text-sm">Let's set up your skin profile to get personalized product recommendations</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Camera className="text-primary" />
              <div>
                <p className="text-sm font-medium">Scan Ingredients</p>
                <p className="text-xs text-gray-600">Use your camera to analyze products</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <UserCheck className="text-primary" />
              <div>
                <p className="text-sm font-medium">Personalized Analysis</p>
                <p className="text-xs text-gray-600">Get recommendations based on your skin type</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Save className="text-primary" />
              <div>
                <p className="text-sm font-medium">Build Your Library</p>
                <p className="text-xs text-gray-600">Save and track your skincare products</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1 app-gradient text-white font-medium"
              onClick={onStartProfile}
            >
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
