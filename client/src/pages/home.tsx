import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import OnboardingModal from "@/components/onboarding/onboarding-modal";
import SkinProfileModal from "@/components/onboarding/skin-profile-modal";
import IngredientScanner from "@/components/scanner/ingredient-scanner";
import ProductCard from "@/components/ui/product-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSkinProfile, setShowSkinProfile] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch recent products
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Auto-show onboarding for users without completed profile
  useEffect(() => {
    if (user && !user.profileCompleted && !showSkinProfile) {
      setShowOnboarding(true);
    }
  }, [user, showSkinProfile]);

  // Check if user needs onboarding
  const shouldShowOnboarding = user && !user.profileCompleted && showOnboarding && !showSkinProfile;

  if (userLoading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
            </svg>
          </div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AppHeader />
      
      <main className="pb-20 px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Анализ ваших продуктов</h2>
          <p className="text-gray-600 text-sm">Сканируйте состав для получения персональных рекомендаций</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-600">{stats?.analyzedProducts || 0}</div>
            <div className="text-xs text-green-700 font-medium">Проанализировано</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-600">{stats?.compatibility || 0}%</div>
            <div className="text-xs text-blue-700 font-medium">Совместимость</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600">{stats?.savedMoney || 0}₽</div>
            <div className="text-xs text-purple-700 font-medium">Сэкономлено</div>
          </div>
        </div>

        {/* Scanner Section */}
        <Card className="border-gray-200">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Умный AI-сканер</h3>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">На основе продвинутого AI-анализа</span>
              </div>
            </div>
            
            {/* Camera Preview Area */}
            <div className="relative bg-gray-100 rounded-xl h-48 flex items-center justify-center overflow-hidden">
              {showScanner ? (
                <IngredientScanner onClose={() => setShowScanner(false)} />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 text-sm">Поместите список ингредиентов в кадр</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                className="flex-1 app-gradient text-white font-medium"
                onClick={() => setShowScanner(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                Сканировать состав
              </Button>
              <Button variant="outline" className="px-4">
                <Upload className="w-4 h-4" />
              </Button>
            </div>

            {/* Manual Input Option */}
            <div className="text-center">
              <Button 
                variant="link" 
                className="text-sm text-gray-500"
                onClick={() => setLocation("/scanner")}
              >
                Или введите состав вручную
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Analysis */}
        {products.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Последние анализы</h3>
            <div className="space-y-3">
              {products.slice(0, 3).map((product: any) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onClick={() => setLocation(`/analysis/${product.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />

      {/* Modals */}
      {shouldShowOnboarding && (
        <OnboardingModal 
          isOpen={true}
          onClose={() => setShowOnboarding(false)}
          onStartProfile={() => {
            setShowOnboarding(false);
            setShowSkinProfile(true);
          }}
        />
      )}

      <SkinProfileModal 
        isOpen={showSkinProfile}
        onClose={() => setShowSkinProfile(false)}
      />

      {/* Admin Link Footer */}
      <div className="fixed bottom-24 left-0 right-0 text-center z-10">
        <button
          onClick={() => setLocation('/admin')}
          className="text-xs text-gray-500 hover:text-gray-700 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm transition-colors"
        >
          Вход для администратора
        </button>
      </div>
    </div>
  );
}
