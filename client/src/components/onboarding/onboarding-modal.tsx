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
            <h3 className="text-xl font-bold">Добро пожаловать в Skiiin IQ</h3>
            <p className="text-gray-600 text-sm">Настройте профиль кожи для получения персональных рекомендаций по продуктам</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Camera className="text-primary" />
              <div>
                <p className="text-sm font-medium">Сканирование состава</p>
                <p className="text-xs text-gray-600">Используйте камеру для анализа продуктов</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <UserCheck className="text-primary" />
              <div>
                <p className="text-sm font-medium">Персональный анализ</p>
                <p className="text-xs text-gray-600">Получайте рекомендации на основе вашего типа кожи</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Save className="text-primary" />
              <div>
                <p className="text-sm font-medium">Создайте библиотеку</p>
                <p className="text-xs text-gray-600">Сохраняйте и отслеживайте ваши косметические продукты</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Пропустить
            </Button>
            <Button
              className="flex-1 app-gradient text-white font-medium"
              onClick={onStartProfile}
            >
              Начать
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
